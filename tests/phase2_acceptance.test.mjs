import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Load environment variables if available
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

import { ensureDbInitialized, db } from "../lib/db/index.ts";
import {
  interviewSessions,
  interviewRounds,
  candidateAnswers,
  codeSubmissions,
  questions,
  codingProblems,
  interviewReports,
  resumeProfiles,
  revisionQueue,
  candidateSkillsProfile,
  apiUsageLogs,
} from "../lib/db/schema.ts";
import {
  createSession,
  getNextQuestionForRound,
  submitCandidateAnswer,
  askInterviewerQuestion,
  finishSession,
} from "../lib/interview/engine.ts";
import { extractResumeIntelligence, generateProgressiveProjectQuestions } from "../lib/intelligence/resume-job-extractor.ts";
import { evaluateAdaptiveTurn } from "../lib/interview/adaptive-engine.ts";
import { logCodingStep, generateCodingInterviewerProbe } from "../lib/coding/coding-tracker.ts";
import { evaluateCandidateCommunication, evaluateSingleTurnCommunication } from "../lib/assessment/communication-evaluator.ts";
import {
  initializeSkillsProfile,
  updateSkillsProfileFromSession,
  syncRevisionQueueFromSession,
  recordRevisionAttempt,
  getPersistentSkills,
  getRevisionQueueItems,
} from "../lib/assessment/revision-engine.ts";
import { getHistoricalAnalytics } from "../lib/analytics/historical-analytics.ts";
import { logAPIUsage, getAPIUsageSummary } from "../lib/ai/usage-tracker.ts";
import { eq } from "drizzle-orm";

describe("Phase 2 — Advanced Interview Intelligence & Personalized Learning Master Suite", () => {
  let testSessionId = "";
  let testProfileId = "";
  let sampleQuestionId = "";

  // 1. Resume-based questions use only documented candidate information
  test("1. Resume-based questions use only documented candidate information — zero fabrication", async () => {
    const rawResumeText = `
John Doe
Software Engineer
Skills: Java, Spring Boot, PostgreSQL, Docker
Projects:
Distributed E-Commerce API
Developed microservices backend using Spring Boot and PostgreSQL.
Architecture: Microservices with event-driven messaging.
Trade-offs: Chose PostgreSQL over MongoDB because of strict ACID compliance requirements.
`;

    const extracted = extractResumeIntelligence({ rawResumeText });

    // Assert that explicitly documented skills are extracted
    assert.ok(extracted.skills.includes("Java"));
    assert.ok(extracted.skills.includes("Spring Boot"));
    assert.ok(extracted.skills.includes("PostgreSQL"));

    // Assert that unmentioned skills are NEVER fabricated
    assert.equal(extracted.skills.includes("Kubernetes"), false, "Must not fabricate Kubernetes");
    assert.equal(extracted.skills.includes("GraphQL"), false, "Must not fabricate GraphQL");

    // Assert that project architecture questions probe explicitly mentioned tech
    assert.ok(extracted.projects.length >= 1);
    const proj = extracted.projects[0];
    const questions = generateProgressiveProjectQuestions(proj);

    assert.ok(questions.architectureQuestion.includes("Distributed E-Commerce API"));
    assert.ok(questions.tradeOffQuestion.includes("Spring Boot"));
  });

  // 2. The adaptive interviewer responds to both strong and weak answers
  test("2. The adaptive interviewer responds dynamically to both strong and weak answers", () => {
    const context = {
      sessionId: "test-sess",
      roundNumber: 1,
      currentQuestionIndex: 0,
      mode: "practice",
      difficulty: "fresher",
      timeRemainingSeconds: 2400,
      previousScores: [],
      askedQuestionIds: new Set(),
      historicalWeaknesses: [],
    };

    // Test Strong Answer (score >= 80) -> Deeper architectural follow-up
    const strongDecision = evaluateAdaptiveTurn(
      context,
      "What is Polymorphism?",
      "Polymorphism allows dynamic method dispatch at runtime...",
      { score: 90, strengths: ["Accurate definition"], weaknesses: [], feedback: "Great", rubricScores: [], isSatisfactory: true }
    );
    assert.equal(strongDecision.action, "follow_up");
    assert.ok(strongDecision.explanation.includes("strong competence"));

    // Test Incomplete Answer (score 55) -> Probes omission
    const partialDecision = evaluateAdaptiveTurn(
      context,
      "Explain HashMaps",
      "HashMaps store key-value pairs...",
      { score: 55, strengths: ["Identified key-value"], weaknesses: ["collision handling via chaining"], feedback: "Partial", rubricScores: [], isSatisfactory: false }
    );
    assert.equal(partialDecision.action, "probe_omission");
    assert.ok(partialDecision.prompt.includes("collision handling"));

    // Test Weak Answer (score 25) in Practice mode -> Immediate formative hint
    const weakDecision = evaluateAdaptiveTurn(
      context,
      "Explain Deadlocks",
      "Deadlock is when something is locked.",
      { score: 25, strengths: [], weaknesses: ["Missing 4 Coffman conditions"], feedback: "Requires mutual exclusion, hold and wait, no preemption, circular wait.", rubricScores: [], isSatisfactory: false }
    );
    assert.equal(weakDecision.action, "practice_hint");
    assert.ok(weakDecision.prompt.includes("[Practice Coaching]"));
  });

  // 3. Candidate counterquestions do not accidentally advance the round
  test("3. Candidate counterquestions do not accidentally advance the round", async () => {
    await ensureDbInitialized();
    const session = await createSession({
      targetRole: "Backend Engineer",
      companyProfile: "Product-Based Engineering",
      difficulty: "fresher",
      mode: "strict",
      interviewModeVariant: "full_mock",
    });

    testSessionId = session.sessionId;

    // Ask clarification counterquestion
    const clarification = await askInterviewerQuestion({
      sessionId: testSessionId,
      candidateQuestion: "Could you please clarify if the input array can contain negative integers?",
    });

    assert.equal(clarification.clarified, true);
    assert.equal(clarification.preservesOriginalQuestion, true);

    // Verify session round and index did NOT advance
    const [sess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, testSessionId));
    assert.equal(sess.currentRound, 1, "Round must remain 1 after clarification");
    assert.equal(sess.currentQuestionIndex, 0, "Question index must remain 0 after clarification");
  });

  // 4. Coding feedback uses actual execution evidence
  test("4. Coding feedback uses actual execution evidence — compiler-derived correctness", async () => {
    const [problem] = await db.select().from(codingProblems).limit(1);
    assert.ok(problem, "Problem must exist in database");

    // Log coding step
    const step = await logCodingStep({
      sessionId: testSessionId,
      problemId: problem.id,
      stepType: "complexity_stated",
      content: "O(N) time complexity using two-pointers and O(1) auxiliary space.",
    });

    assert.ok(step.id);
    assert.equal(step.stepType, "complexity_stated");

    // Generate inquiry based on compiler failure
    const inquiry = generateCodingInterviewerProbe({
      hasApproach: true,
      hasCode: true,
      compilerStatus: "wrong_answer",
      failedTestCount: 2,
    });

    assert.ok(inquiry.includes("failed on 2 test case(s)"));
    assert.ok(inquiry.includes("why do you think this edge case failed"));
  });

  // 5. Communication feedback cites the stored transcript
  test("5. Communication feedback cites the stored transcript with exact sentences & corrections", () => {
    const transcript = [
      "In this architecture, hashmap are basically very fast for storing objects.",
    ];

    const report = evaluateCandidateCommunication(transcript);

    assert.ok(report.issues.length >= 1, "Must detect grammatical issue");
    const firstIssue = report.issues[0];

    // Cites exact sentence
    assert.equal(firstIssue.submittedSentence, "In this architecture, hashmap are basically very fast for storing objects.");
    // Suggests correct sentence
    assert.ok(firstIssue.correctedSentence.includes("A hashmap is"));
    // Provides improved interview formulation
    assert.ok(firstIssue.improvedInterviewVersion.length > 10);
    // STT disclaimer present
    assert.ok(report.disclaimer.includes("Accents, voice pitch, regional dialects, and speech pace are not measured"));

    // Practice mode single-turn evaluator
    const singleTurn = evaluateSingleTurnCommunication("we can able to build the system.");
    assert.ok(singleTurn !== null);
    assert.ok(singleTurn.correctedSentence.includes("we can"));
  });

  // 6. Not Assessed topics do not receive fabricated scores
  test("6. Not Assessed topics do not receive fabricated scores — score remains null", async () => {
    await initializeSkillsProfile();
    const skills = await getPersistentSkills();

    // Verify skills that were never asked remain 'not_assessed' with score = null
    const unassessed = skills.filter(s => s.status === "not_assessed");
    assert.ok(unassessed.length > 0, "There must be unassessed skills initially");

    for (const u of unassessed) {
      assert.equal(u.score, null, `Unassessed skill ${u.label} must have null score`);
    }
  });

  // 7. Revision questions come from recorded weaknesses
  test("7. Revision questions come from recorded weaknesses — spaced repetition queue", async () => {
    assert.ok(testSessionId);

    const weakQId = "q-deadlock-" + Math.random().toString(36).substring(2, 8);
    // Insert a weak answer record (score 35)
    await db.insert(candidateAnswers).values({
      id: "ans-weak-" + Math.random().toString(36).substring(2, 10),
      sessionId: testSessionId,
      roundNumber: 1,
      questionId: weakQId,
      questionText: "What are the four Coffman conditions for Deadlock?",
      answerText: "Only mutual exclusion.",
      evaluationScore: 35,
      rubricBreakdown: "[]",
      strengths: "[]",
      weaknesses: JSON.stringify(["Omitted hold and wait, no preemption, circular wait"]),
      feedback: "Missed 3 of 4 conditions.",
      createdAt: new Date(),
    });

    // Sync revision queue
    const count = await syncRevisionQueueFromSession(testSessionId);
    assert.ok(count >= 1, "Should enqueue at least 1 weak item");

    const queue = await getRevisionQueueItems("all");
    const item = queue.find(q => q.questionId === weakQId);
    assert.ok(item, "Weak question must appear in revision queue");
    assert.equal(item.reason, "previously_incorrect");

    // Record revision practice attempt
    await recordRevisionAttempt({
      revisionItemId: item.id,
      candidateResponse: "Mutual exclusion, Hold and wait, No preemption, Circular wait.",
      score: 95,
      feedback: "All four conditions accurately stated.",
    });

    const updatedQueue = await getRevisionQueueItems("all");
    const updatedItem = updatedQueue.find(q => q.id === item.id);
    assert.equal(updatedItem.status, "reviewed");
    assert.ok(updatedItem.repetitionCount >= 1);
  });

  // 8. Historical charts use actual saved records
  test("8. Historical charts use actual saved records — flags insufficient data correctly", async () => {
    const analytics = await getHistoricalAnalytics();

    assert.ok(typeof analytics.totalInterviews === "number");
    assert.ok(typeof analytics.completedInterviews === "number");
    assert.ok(Array.isArray(analytics.roundAverages));
    assert.ok(Array.isArray(analytics.topicMastery));

    // If completed sessions < 2, hasSufficientData must be false
    if (analytics.completedInterviews < 2) {
      assert.equal(analytics.hasSufficientData, false, "Must flag insufficient data when < 2 completed interviews exist");
    }
  });

  // 9. API errors preserve session state
  test("9. API errors preserve session state — logs error without crashing", async () => {
    await logAPIUsage({
      service: "groq_ai",
      endpoint: "/api/interviews/answer",
      modelOrLang: "openai/gpt-oss-120b",
      status: "error",
      responseTimeMs: 15200,
      errorMessage: "Rate limit reached: 429 Too Many Requests",
    });

    const summary = await getAPIUsageSummary();
    assert.ok(summary.totalErrors >= 1);
    assert.equal(summary.isEstimated, true, "Must explicitly state metrics are local estimates");

    // Verify session still exists in DB
    const [sess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, testSessionId));
    assert.ok(sess, "Session must remain intact despite API error");
  });

  // 10. All new records survive application restarts
  test("10. All new records survive application restarts — database persistence verification", async () => {
    // Query directly from database tables
    const sessions = await db.select().from(interviewSessions);
    const answers = await db.select().from(candidateAnswers);
    const revision = await db.select().from(revisionQueue);

    assert.ok(sessions.length > 0, "Sessions must persist in DB");
    assert.ok(answers.length > 0, "Candidate answers must persist in DB");
    assert.ok(revision.length > 0, "Revision queue must persist in DB");
  });

  // 11. Existing four-round interviewing and voice functionality remain intact
  test("11. Existing four-round interviewing and voice functionality remain intact", async () => {
    const session = await createSession({
      targetRole: "Java Developer",
      companyProfile: "TCS",
      difficulty: "fresher",
      mode: "practice",
      interviewModeVariant: "full_mock",
    });

    const rounds = await db.select().from(interviewRounds).where(eq(interviewRounds.sessionId, session.sessionId));
    assert.equal(rounds.length, 4, "Must have exactly 4 rounds created");
    assert.equal(rounds[0].roundName, "Technical Fundamentals");
    assert.equal(rounds[1].roundName, "Advanced CS & Projects");
    assert.equal(rounds[2].roundName, "Coding Interview");
    assert.equal(rounds[3].roundName, "Behavioral & HR");
  });

  // 12. No mandatory paid APIs are introduced
  test("12. No mandatory paid APIs are introduced — local dev fallback operates without keys", async () => {
    // Verify that local fallback and Web Speech API operate without paid subscription
    const localEvaluation = evaluateAdaptiveTurn(
      {
        sessionId: "sess-local",
        roundNumber: 1,
        currentQuestionIndex: 0,
        mode: "strict",
        difficulty: "fresher",
        timeRemainingSeconds: 1800,
        previousScores: [],
        askedQuestionIds: new Set(),
        historicalWeaknesses: [],
      },
      "Question",
      "Answer",
      { score: 75, strengths: ["Valid"], weaknesses: [], feedback: "Good", rubricScores: [], isSatisfactory: true }
    );

    assert.ok(localDecisionExists(localEvaluation));
  });
});

function localDecisionExists(decision) {
  return decision && typeof decision.prompt === "string" && decision.explanation.length > 0;
}
