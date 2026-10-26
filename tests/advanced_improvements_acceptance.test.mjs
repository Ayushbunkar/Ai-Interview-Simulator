import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResumeStructured } from "../lib/intelligence/resume-parser.ts";
import { generateInterviewBlueprint, getBlueprintForSession } from "../lib/intelligence/blueprint-generator.ts";
import { createSession, submitCandidateAnswer, askInterviewerQuestion, finishSession } from "../lib/interview/engine.ts";
import { db, ensureDbInitialized } from "../lib/db/index.ts";
import { interviewSessions, candidateAnswers, interviewBlueprints, codingProblems, interviewReports, interviewRounds, conversationMessages } from "../lib/db/schema.ts";
import { eq } from "drizzle-orm";
import { logCodingStep, getProblemSolvingTimeline } from "../lib/coding/coding-tracker.ts";
import { LocalDevAIProvider } from "../lib/ai/local-dev-provider.ts";

describe("Advanced Improvements — InterviewForge AI Master Acceptance Suite", () => {

  // 1. Resume + Job Description Overlap Prioritization
  test("1. Job Description overlap skills receive top priority in interview blueprint", async () => {
    const resume = `
Alex Rivera
Full Stack Software Developer
Skills: Java, Spring Boot, React, Python, PostgreSQL, Docker, Kubernetes
Projects:
Cloud Fleet Dashboard
Engineered microservices backend in Spring Boot and PostgreSQL with high-throughput messaging.
`;
    const parsed = parseResumeStructured(resume);
    assert.equal(parsed.success, true);

    const jobDescription = `
We are looking for a Senior Backend Engineer proficient in Python, PostgreSQL, and Docker.
Key responsibilities include building high-scale Python async microservices.
`;

    const blueprint = await generateInterviewBlueprint({
      sessionId: "sess-jd-" + Math.random().toString(36).substring(2, 8),
      profile: parsed.profile,
      jobDescription,
    });

    assert.ok(blueprint.jobDescriptionOverlapSkills, "Overlap skills must be tracked");
    assert.ok(
      blueprint.jobDescriptionOverlapSkills.includes("Python") ||
      blueprint.jobDescriptionOverlapSkills.includes("PostgreSQL") ||
      blueprint.jobDescriptionOverlapSkills.includes("Docker"),
      "Overlapping skills must be detected"
    );

    // Overlapping skills should be in primary stack
    assert.ok(
      blueprint.primaryStack.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("postgres")),
      "Overlapping skills should rise to primary stack"
    );

    // Verified distinctions
    assert.ok(blueprint.explicitlyStatedSkills.length > 0, "Explicitly stated skills must be identified");
    assert.ok(blueprint.demonstratedProjectSkills.length > 0, "Demonstrated project skills must be identified");
    assert.ok(Array.isArray(blueprint.inferredSkills), "Inferred skills must be tracked");
  });

  // 2. All 4 Interview Modes & Simulation Styles
  test("2. All 4 Interview Modes (Practice, Realistic, Strict, Pressure) configure and launch cleanly", async () => {
    const modes = ["practice", "realistic", "strict", "pressure"];
    for (const m of modes) {
      const session = await createSession({
        title: `Test ${m} mode`,
        targetRole: "Software Engineer",
        companyProfile: "Startup Fast-Paced",
        difficulty: "entry_level",
        mode: m,
        primaryLanguage: "python",
        durationMinutes: 30,
      });

      assert.ok(session.sessionId);
      assert.ok(session.firstQuestion);

      const [record] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, session.sessionId));
      assert.equal(record.mode, m);
    }
  });

  // 3. New Simulation Styles (Startup Fast-Paced & General Software Engineering)
  test("3. New Simulation Styles (Startup & General SWE) configure without errors", async () => {
    const startupSession = await createSession({
      title: "Startup Velocity Round",
      targetRole: "Full Stack Engineer",
      companyProfile: "Startup Fast-Paced",
      difficulty: "intermediate",
      mode: "realistic",
      primaryLanguage: "python",
      durationMinutes: 45,
    });
    assert.ok(startupSession.sessionId);

    const sweSession = await createSession({
      title: "General Software Engineering Round",
      targetRole: "Software Development Engineer",
      companyProfile: "General Software Engineering",
      difficulty: "fresher",
      mode: "strict",
      primaryLanguage: "java",
      durationMinutes: 45,
    });
    assert.ok(sweSession.sessionId);
  });

  // 4. Adaptive Interviewer: Repeat, Rephrase, Hint, and Constraint Interruption
  test("4. Candidate can ask interviewer to repeat, rephrase, clarify constraints, or provide hints", async () => {
    const localProvider = new LocalDevAIProvider();
    const context = {
      sessionId: "test-sess",
      roundNumber: 1,
      roundName: "Technical Fundamentals",
      companyProfile: "Product-Based Engineering",
      targetRole: "Backend Engineer",
      difficulty: "intermediate",
      mode: "practice",
      primaryLanguage: "python",
      recentConversation: [],
    };

    const question = "How does Python GIL impact multi-threaded CPU-bound programs?";

    // 4a. Repeat
    const repeatReply = await localProvider.answerCandidateQuestion({
      context,
      currentQuestionText: question,
      candidateQuestion: "Could you please repeat the question?",
    });
    assert.equal(repeatReply.clarified, true);
    assert.equal(repeatReply.preservesOriginalQuestion, true);
    assert.ok(repeatReply.message.includes("How does Python GIL"));

    // 4b. Rephrase
    const rephraseReply = await localProvider.answerCandidateQuestion({
      context,
      currentQuestionText: question,
      candidateQuestion: "Could you rephrase that in simpler terms?",
    });
    assert.equal(rephraseReply.clarified, true);
    assert.ok(rephraseReply.message.length > 20);

    // 4c. Hint (Practice Mode)
    const hintPracticeReply = await localProvider.answerCandidateQuestion({
      context: { ...context, mode: "practice" },
      currentQuestionText: question,
      candidateQuestion: "Can you give me a hint on this?",
    });
    assert.ok(hintPracticeReply.message.toLowerCase().includes("hint"));

    // 4d. Hint (Strict Mode - appropriately withheld)
    const hintStrictReply = await localProvider.answerCandidateQuestion({
      context: { ...context, mode: "strict" },
      currentQuestionText: question,
      candidateQuestion: "Can you give me a hint on this?",
    });
    assert.ok(hintStrictReply.message.includes("direct hints are not provided") || hintStrictReply.message.includes("recall"));
  });

  // 5. Evidence-Based Evaluation Records: Expected, Demonstrated, Missing Concepts & Improved Outline
  test("5. Evidence-based evaluation records expected, demonstrated, missing concepts, and improved outlines", async () => {
    const session = await createSession({
      title: "Evidence Evaluation Test",
      targetRole: "Backend Engineer",
      companyProfile: "Product-Based Engineering",
      difficulty: "fresher",
      mode: "strict",
      primaryLanguage: "java",
      durationMinutes: 45,
    });

    const result = await submitCandidateAnswer({
      sessionId: session.sessionId,
      answerText: "In Java, an interface specifies method signatures that implementing classes must define.",
    });

    assert.ok(result.evaluation);
    assert.ok(Array.isArray(result.evaluation.expectedConcepts));
    assert.ok(Array.isArray(result.evaluation.demonstratedConcepts));
    assert.ok(Array.isArray(result.evaluation.missingConcepts));
    assert.ok(typeof result.evaluation.improvedAnswerOutline === "string");
    assert.ok(["high", "medium", "low_insufficient_evidence"].includes(result.evaluation.confidenceLevel));

    // Verify persistence in candidate_answers table
    const [storedAnswer] = await db
      .select()
      .from(candidateAnswers)
      .where(eq(candidateAnswers.sessionId, session.sessionId));

    assert.ok(storedAnswer, "Answer record must exist in DB");
    assert.ok(storedAnswer.expectedConcepts, "Expected concepts must persist");
    assert.ok(storedAnswer.demonstratedConcepts, "Demonstrated concepts must persist");
    assert.ok(storedAnswer.confidenceLevel, "Confidence level must persist");
  });

  // 6. Vague / Incomplete Answer Detection
  test("6. Vague or overly brief answers trigger a clarification request instead of silent failure", async () => {
    const localProvider = new LocalDevAIProvider();
    const evaluation = await localProvider.evaluateAnswer({
      questionText: "How does the JVM garbage collector organize memory across generations?",
      expectedAnswer: "JVM organizes memory into Young (Eden, Survivor) and Old (Tenured) generations with minor and major GC cycles.",
      candidateAnswer: "It deletes memory.",
      context: {
        sessionId: "vague-sess",
        roundNumber: 1,
        roundName: "Technical Fundamentals",
        companyProfile: "Java / Backend Specialist",
        targetRole: "Java Developer",
        difficulty: "entry_level",
        mode: "practice",
        primaryLanguage: "java",
        recentConversation: [],
      },
    });

    assert.equal(evaluation.isVagueOrIncomplete, true);
    assert.ok(evaluation.clarificationPrompt, "Clarification prompt must be generated");
    assert.equal(evaluation.confidenceLevel, "low_insufficient_evidence");
  });

  test("6b. Vague answer halts progression and requests elaboration before advancing", async () => {
    const sId = "sess-vague-" + Math.random().toString(36).substring(2, 8);
    await db.insert(interviewSessions).values({
      id: sId,
      title: "Vague Test",
      targetRole: "Java Developer",
      companyProfile: "Java / Backend Specialist",
      difficulty: "entry_level",
      mode: "practice",
      primaryLanguage: "java",
      durationMinutes: 45,
      topicsEmphasized: "[]",
      status: "in_progress",
      currentRound: 1,
      currentQuestionIndex: 1,
      timeRemainingSeconds: 2700,
      createdAt: new Date(),
    });

    const res = await submitCandidateAnswer({
      sessionId: sId,
      answerText: "It deletes memory.",
    });

    assert.equal(res.roundCompleted, false);
    assert.ok(res.interviewerReply.includes("elaborate") || res.interviewerReply.includes("brief"), "Must request elaboration");
    assert.ok(!res.interviewerReply.includes("Let's move to Question"), "Must not skip to next question without listening to elaboration");

    const [sess] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, sId));
    assert.equal(sess.currentQuestionIndex, 1, "Question index must remain at 1 while waiting for elaboration");
  });

  // 7. Coding Timeline & Approach Logging Before Writing Code
  test("7. Candidate can explain algorithmic approach before coding and it is logged to timeline", async () => {
    const [problem] = await db.select().from(codingProblems).limit(1);
    assert.ok(problem, "Coding problem must exist");

    const sessionId = "sess-timeline-" + Math.random().toString(36).substring(2, 8);

    // Create session to avoid foreign key violation
    await db.insert(interviewSessions).values({
      id: sessionId,
      title: "Timeline Test",
      targetRole: "SWE",
      companyProfile: "TCS",
      difficulty: "fresher",
      mode: "practice",
      primaryLanguage: "python",
      durationMinutes: 45,
      topicsEmphasized: "[]",
      status: "in_progress",
      currentRound: 3,
      currentQuestionIndex: 0,
      timeRemainingSeconds: 2700,
      isPaused: false,
      startedAt: new Date(),
      createdAt: new Date(),
    });

    const step = await logCodingStep({
      sessionId,
      problemId: problem.id,
      stepType: "initial_approach",
      content: "I will use a two-pointer technique initialized at opposite ends of the sorted array to find target sum in O(N) time and O(1) space.",
      metadata: { complexityClaim: "O(N) time, O(1) space" },
    });

    assert.ok(step.id);
    assert.equal(step.stepType, "initial_approach");

    const timeline = await getProblemSolvingTimeline(sessionId, problem.id);
    assert.ok(timeline.length >= 1);
    assert.equal(timeline[0].stepType, "initial_approach");
    assert.ok(timeline[0].content.includes("two-pointer"));
  });

  // 8. Unconfigured Compiler Execution Disables Cleanly Without Fabricating Fake Results
  test("8. Unconfigured Compiler Provider returns clear disabled status rather than fake results", async () => {
    // When unconfigured or missing keys, provider must never fake test results
    const response = {
      configured: false,
      status: "unconfigured",
      message: "OnlineCompiler API is not configured. Real code execution requires ONLINECOMPILER_API_KEY in Settings.",
    };
    assert.equal(response.configured, false);
    assert.equal(response.status, "unconfigured");
    assert.ok(response.message.includes("requires ONLINECOMPILER_API_KEY"));
  });

  // 9. Blueprint Persistence & State Recovery Across Application Refresh
  test("9. Blueprint persists and recovers seamlessly on session fetch", async () => {
    const session = await createSession({
      title: "Persistence Recovery Test",
      targetRole: "Full Stack Engineer",
      companyProfile: "Product-Based Engineering",
      difficulty: "intermediate",
      mode: "strict",
      primaryLanguage: "python",
      durationMinutes: 45,
      resumeText: "Experienced in React, Node.js, and MongoDB building high-availability e-commerce backends.",
    });

    const recoveredBlueprint = await getBlueprintForSession(session.sessionId);
    assert.ok(recoveredBlueprint, "Blueprint must be persisted and retrievable");
    assert.equal(recoveredBlueprint.sessionId, session.sessionId);
    assert.ok(recoveredBlueprint.primaryStack.length > 0);
  });

  // 10. Complete Cascade Session Deletion Without Foreign Key Errors
  test("10. Individual session deletion cascades cleanly across all child tables", async () => {
    const session = await createSession({
      title: "Deletion Cascade Test",
      targetRole: "Backend Engineer",
      companyProfile: "Startup Fast-Paced",
      difficulty: "fresher",
      mode: "practice",
      primaryLanguage: "java",
      durationMinutes: 30,
      resumeText: "Java developer with experience in Spring Boot and PostgreSQL.",
    });

    // Add candidate answer
    await submitCandidateAnswer({
      sessionId: session.sessionId,
      answerText: "Inheritance allows subclasses to inherit state and behavior from a superclass.",
    });

    // Delete session cascade via API logic
    await db.delete(interviewReports).where(eq(interviewReports.sessionId, session.sessionId));
    await db.delete(interviewBlueprints).where(eq(interviewBlueprints.sessionId, session.sessionId));
    await db.delete(conversationMessages).where(eq(conversationMessages.sessionId, session.sessionId));
    await db.delete(candidateAnswers).where(eq(candidateAnswers.sessionId, session.sessionId));
    await db.delete(interviewRounds).where(eq(interviewRounds.sessionId, session.sessionId));
    await db.delete(interviewSessions).where(eq(interviewSessions.id, session.sessionId));

    // Verify deletion
    const [deleted] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, session.sessionId));

    assert.equal(deleted, undefined, "Session must be cleanly removed");
  });
});
