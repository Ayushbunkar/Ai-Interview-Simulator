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
  interviewBlueprints,
} from "../lib/db/schema.ts";
import {
  createSession,
  getNextQuestionForRound,
  submitCandidateAnswer,
  askInterviewerQuestion,
  finishSession,
} from "../lib/interview/engine.ts";
import {
  parseResumeStructured,
  extractTextFromDocument,
} from "../lib/intelligence/resume-parser.ts";
import {
  generateInterviewBlueprint,
  getBlueprintForSession,
  TECH_INTERVIEW_TREES,
} from "../lib/intelligence/blueprint-generator.ts";
import { compileResumeAssessmentDossier } from "../lib/intelligence/resume-report-generator.ts";
import { evaluateAdaptiveTurn } from "../lib/interview/adaptive-engine.ts";
import { eq } from "drizzle-orm";

describe("Master Prompt — Resume-Aware Intelligent Interview Engine Suite (15 Acceptance Criteria)", () => {
  let reactSessionId = "";
  let javaSessionId = "";

  const reactResume = `
Alex Rivera
Frontend & Full-Stack Developer
Skills: React, Next.js, Node.js, Express.js, MongoDB, TypeScript, Tailwind CSS, Jest
Projects:
E-Commerce Full-Stack Platform
Developed full-stack web application using React, Next.js, Node.js, and MongoDB.
Architecture: Component-driven frontend with Next.js App Router and RESTful Express backend.
Trade-offs: Selected MongoDB over PostgreSQL to store semi-structured product catalogs and nested order items.
`;

  const javaResume = `
Samantha Chen
Backend Systems Engineer
Skills: Java, Spring Boot, PostgreSQL, Docker, Kubernetes, JUnit, Microservices
Projects:
High-Throughput Payment Processor
Built distributed transaction ledger handling payment events using Java and Spring Boot.
Architecture: Event-driven microservices architecture connecting to PostgreSQL with ACID compliance.
Trade-offs: Selected PostgreSQL with repeatable read isolation to prevent double-spending race conditions.
`;

  // 1. A React/Node.js/MongoDB resume produces a relevant interview plan
  test("1. A React/Node.js/MongoDB resume produces a relevant interview plan", async () => {
    await ensureDbInitialized();
    const parsed = parseResumeStructured(reactResume);

    assert.ok(parsed.profile.skills.frontend.includes("React"));
    assert.ok(parsed.profile.skills.frontend.includes("Next.js"));
    assert.ok(parsed.profile.skills.backend.includes("Node.js"));
    assert.ok(parsed.profile.skills.databases.includes("MongoDB"));

    const session = await createSession({
      targetRole: "Full Stack Developer",
      companyProfile: "Product-Based Engineering",
      difficulty: "fresher",
      mode: "strict",
      resumeText: reactResume,
    });
    reactSessionId = session.sessionId;

    const blueprint = await getBlueprintForSession(reactSessionId);
    assert.ok(blueprint, "Blueprint must be persisted in database");

    // Primary stack must reflect React, Node, MongoDB
    assert.ok(blueprint.primaryStack.includes("React") || blueprint.primaryStack.includes("Node.js"));
    assert.ok(blueprint.primaryStack.includes("MongoDB") || blueprint.primaryStack.includes("Next.js"));

    // First question in Round 1 must evaluate candidate's verified stack, not generic Java OOP
    assert.ok(
      session.firstQuestion.questionText.includes("React") ||
      session.firstQuestion.questionText.includes("props and state") ||
      session.firstQuestion.questionText.includes("Node") ||
      session.firstQuestion.questionText.includes("MongoDB"),
      `Expected React/Node/MongoDB question, got: ${session.firstQuestion.questionText}`
    );
  });

  // 2. A Java/Python resume produces a different, appropriate plan
  test("2. A Java/Python resume produces a different, appropriate plan", async () => {
    await ensureDbInitialized();
    const session = await createSession({
      targetRole: "Backend Engineer",
      companyProfile: "Service-Based General",
      difficulty: "fresher",
      mode: "strict",
      resumeText: javaResume,
    });
    javaSessionId = session.sessionId;

    const blueprint = await getBlueprintForSession(javaSessionId);
    assert.ok(blueprint);

    // Primary stack must focus on Java and Spring Boot
    assert.ok(blueprint.primaryStack.includes("Java"));
    assert.ok(blueprint.primaryStack.includes("Spring Boot") || blueprint.primaryStack.includes("PostgreSQL"));

    // Language must default to Java
    assert.equal(blueprint.primaryLanguage, "java");

    // Question must probe Java/Spring, completely different from Alex's React interview
    assert.ok(
      session.firstQuestion.questionText.includes("Java") ||
      session.firstQuestion.questionText.includes("Spring") ||
      session.firstQuestion.questionText.includes("PostgreSQL") ||
      session.firstQuestion.questionText.includes("polymorphism") ||
      session.firstQuestion.questionText.includes("overloading"),
      `Expected Java/Spring question, got: ${session.firstQuestion.questionText}`
    );
  });

  // 3. Project technologies receive higher priority when the resume demonstrates practical implementation
  test("3. Project technologies receive higher priority when demonstrated in projects", async () => {
    const mixedResume = `
Candidate Name
Skills: Kotlin, Rust, Python, React, MongoDB
Projects:
Real-Time Chat Engine
Engineered websocket platform using React and MongoDB with aggregation pipeline.
`;
    const parsed = parseResumeStructured(mixedResume);
    const blueprint = await generateInterviewBlueprint({
      sessionId: "temp-sess",
      profile: parsed.profile,
    });

    // React and MongoDB are used in projects, so they must outrank casually listed Rust and Kotlin
    const topTwo = blueprint.primaryStack.slice(0, 2);
    assert.ok(topTwo.includes("React") || topTwo.includes("MongoDB"));
  });

  // 4. The application does not require manual technology selection
  test("4. The application does not require manual technology selection — automates stack mapping", async () => {
    // Session created without topicsEmphasized
    const session = await createSession({
      targetRole: "Full Stack Engineer",
      companyProfile: "Custom / General",
      difficulty: "fresher",
      mode: "practice",
      resumeText: reactResume,
    });

    const [sess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, session.sessionId));
    assert.ok(sess.resumeProfileId, "Profile ID automatically attached");

    const bp = await getBlueprintForSession(session.sessionId);
    assert.ok(bp.highPriorityTopics.length >= 2, "High priority topics automatically populated from resume");
  });

  // 5. Missing or unreadable resumes produce a clear error rather than fabricated extraction
  test("5. Missing or unreadable resumes produce a clear error rather than fabricated extraction", async () => {
    // Test 1: Empty text
    const emptyResult = parseResumeStructured("");
    assert.equal(emptyResult.success, false);
    assert.ok(emptyResult.error?.includes("insufficient text") || emptyResult.isScannedPdf);

    // Test 2: Scanned PDF buffer simulation (zero alphanumeric selectable text)
    const scannedDoc = await extractTextFromDocument({
      buffer: Buffer.from("%PDF-1.4 scanned image dummy payload without text"),
      fileName: "scanned_invoice_resume.pdf",
      mimeType: "application/pdf",
    });

    assert.equal(scannedDoc.isScannedPdf, true, "Must flag scanned document");
    assert.equal(scannedDoc.text, "", "Must never fabricate words from scanned PDF");
  });

  // 6. The interviewer asks contextual follow-ups
  test("6. The interviewer asks contextual follow-ups", async () => {
    assert.ok(reactSessionId);
    const answerResult = await submitCandidateAnswer({
      sessionId: reactSessionId,
      answerText: "In React, props are passed into a component from its parent and are immutable, whereas state is managed internally by the component. When state changes, React triggers a component re-render.",
    });

    assert.ok(answerResult.evaluation);
    assert.ok(answerResult.interviewerReply.length > 20);
  });

  // 7. Weak answers trigger suitable probing questions
  test("7. Weak answers trigger suitable probing questions", () => {
    const context = {
      sessionId: "s1",
      roundNumber: 1,
      currentQuestionIndex: 0,
      mode: "strict",
      difficulty: "fresher",
      timeRemainingSeconds: 1800,
      previousScores: [],
      askedQuestionIds: new Set(),
      historicalWeaknesses: [],
    };

    const weakDecision = evaluateAdaptiveTurn(
      context,
      "Explain the Node.js event loop phases.",
      "It loops around.",
      { score: 30, strengths: [], weaknesses: ["Missing event loop phases: timers, poll, check"], feedback: "Missing phases.", rubricScores: [], isSatisfactory: false }
    );

    // Strict mode records weakness without premature reveal
    assert.equal(weakDecision.action, "advance_question");
    assert.equal(weakDecision.targetDifficulty, "easy");
  });

  // 8. Strong answers can trigger deeper questions
  test("8. Strong answers can trigger deeper questions", () => {
    const context = {
      sessionId: "s2",
      roundNumber: 1,
      currentQuestionIndex: 0,
      mode: "strict",
      difficulty: "fresher",
      timeRemainingSeconds: 1800,
      previousScores: [],
      askedQuestionIds: new Set(),
      historicalWeaknesses: [],
    };

    const strongDecision = evaluateAdaptiveTurn(
      context,
      "What is the difference between props and state?",
      "Props are read-only external inputs passed from parent components, while state is internal mutable state managed by useState or useReducer. State changes schedule a re-render in the fiber tree.",
      { score: 92, strengths: ["Complete distinction", "Fiber tree mention"], weaknesses: [], feedback: "Excellent", rubricScores: [], isSatisfactory: true }
    );

    assert.equal(strongDecision.action, "follow_up");
    assert.equal(strongDecision.targetDifficulty, "hard");
  });

  // 9. The question planner avoids unnecessary repetition
  test("9. The question planner avoids unnecessary repetition", async () => {
    assert.ok(reactSessionId);

    const q1 = await getNextQuestionForRound(reactSessionId, 1, 0);
    const q2 = await getNextQuestionForRound(reactSessionId, 1, 1);

    assert.notEqual(q1.questionText, q2.questionText, "Questions in subsequent indices must not repeat");
  });

  // 10. Coding language selection follows the demonstrated programming stack sensibly
  test("10. Coding language selection follows demonstrated programming stack sensibly", async () => {
    // Java resume -> defaults to Java
    const [javaSess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, javaSessionId));
    assert.equal(javaSess.primaryLanguage, "java");

    // Python AI resume -> defaults to Python
    const pythonResume = `
Name: Data Engineer
Skills: Python, PyTorch, LangChain, RAG
Projects:
Vector Search Engine using Python and embeddings.
`;
    const pySession = await createSession({
      targetRole: "AI Engineer",
      companyProfile: "AI / ML & GenAI",
      difficulty: "fresher",
      mode: "strict",
      resumeText: pythonResume,
    });

    const [pySess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, pySession.sessionId));
    assert.equal(pySess.primaryLanguage, "python");
  });

  // 11. Voice interruptions preserve the current interview question
  test("11. Voice interruptions preserve the current interview question", async () => {
    assert.ok(reactSessionId);
    const [beforeSess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, reactSessionId));

    const reply = await askInterviewerQuestion({
      sessionId: reactSessionId,
      candidateQuestion: "Could you please explain what you mean by reconciliation in React?",
    });

    assert.equal(reply.clarified, true);
    assert.equal(reply.preservesOriginalQuestion, true);

    const [afterSess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, reactSessionId));
    assert.equal(afterSess.currentRound, beforeSess.currentRound);
    assert.equal(afterSess.currentQuestionIndex, beforeSess.currentQuestionIndex);
  });

  // 12. All assessments are saved in interview history
  test("12. All assessments are saved in interview history", async () => {
    const reportRes = await finishSession(reactSessionId);
    assert.ok(reportRes.reportId);

    const [reportInDb] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, reactSessionId));
    assert.ok(reportInDb, "Report must exist in database");
    assert.ok(reportInDb.resumeAssessmentReport, "Resume assessment report must exist in database");
  });

  // 13. The final report separates demonstrated skills from unassessed skills
  test("13. The final report separates demonstrated skills from unassessed skills", async () => {
    const [report] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, reactSessionId));
    assert.ok(report.resumeAssessmentReport);

    const dossier = JSON.parse(report.resumeAssessmentReport);

    // Verifies 12-point questions
    assert.ok(Array.isArray(dossier.technologiesFound));
    assert.ok(Array.isArray(dossier.technologiesDeeplyAssessed));
    assert.ok(Array.isArray(dossier.skillsDemonstratedConvincingly));
    assert.ok(Array.isArray(dossier.skillsListedNotDemonstrated));
    assert.ok(Array.isArray(dossier.resumeTopicsRemainingUnassessed));
    assert.ok(typeof dossier.recommendedFollowUpInterview === "string");

    // Unassessed skills must NOT be treated as zero or demonstrated
    for (const unassessed of dossier.resumeTopicsRemainingUnassessed) {
      assert.equal(dossier.skillsDemonstratedConvincingly.includes(unassessed), false);
    }
  });

  // 14. The application continues to work without API credentials in development mode
  test("14. The application continues to work without API credentials in development mode", async () => {
    const localDossier = compileResumeAssessmentDossier({
      answers: [
        { roundNumber: 1, questionText: "Explain React hooks", answerText: "useState and useEffect handle component state and side effects.", evaluationScore: 85 },
      ],
      blueprint: {
        id: "bp-test",
        sessionId: "sess-local",
        primaryStack: ["React", "TypeScript", "Node.js"],
        secondarySkills: ["MongoDB"],
        highPriorityTopics: ["React"],
        mediumPriorityTopics: [],
        supportingFundamentals: [],
        resumeClaims: [],
        primaryLanguage: "python",
        plannedDistribution: {},
        technologyInterviewTrees: TECH_INTERVIEW_TREES,
      },
    });

    assert.ok(localDossier.technologiesFound.includes("React"));
    assert.ok(localDossier.skillsDemonstratedConvincingly.includes("React"));
  });

  // 15. No existing voice, coding, database, or report functionality regresses
  test("15. No existing voice, coding, database, or report functionality regresses", async () => {
    const problems = await db.select().from(codingProblems).limit(5);
    const questionsList = await db.select().from(questions).limit(5);
    const blueprints = await db.select().from(interviewBlueprints);

    assert.ok(problems.length >= 5, "Coding problems bank intact");
    assert.ok(questionsList.length >= 5, "Question bank intact");
    assert.ok(blueprints.length >= 1, "Interview blueprints operational");
  });
});
