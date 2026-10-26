import { db, ensureDbInitialized } from "../db";
import {
  interviewSessions,
  interviewRounds,
  conversationMessages,
  candidateAnswers,
  codeSubmissions,
  questions,
  codingProblems,
  interviewReports,
  resumeProfiles,
  revisionQueue,
} from "../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getAIProvider, isLiveAIConfigured } from "../ai";
import {
  CompanyProfile,
  InterviewMode,
  InterviewModeVariant,
  RoundNumber,
  AnswerEvaluation,
  ClarificationResponse,
  RubricScoreItem,
} from "../types";
import {
  TECHNICAL_ROUND_RUBRIC,
  BEHAVIORAL_ROUND_RUBRIC,
  CODING_ROUND_RUBRIC,
  calculateWeightedScore,
} from "../rubric";
import { evaluateCandidateCommunication, evaluateSingleTurnCommunication } from "../assessment/communication-evaluator";
import { computeSkillRadarAnalysis } from "../assessment/skill-evaluator";
import { updateSkillsProfileFromSession, syncRevisionQueueFromSession } from "../assessment/revision-engine";
import { evaluateAdaptiveTurn, isNearDuplicateQuestion, calculateAdaptiveDifficulty } from "./adaptive-engine";
import { generateProgressiveProjectQuestions } from "../intelligence/resume-job-extractor";
import { logAPIUsage } from "../ai/usage-tracker";

export interface CreateInterviewInput {
  title?: string;
  targetRole: string;
  companyProfile: CompanyProfile;
  difficulty: "fresher" | "entry_level" | "intermediate" | "experienced";
  mode: InterviewMode;
  interviewModeVariant?: InterviewModeVariant;
  primaryLanguage?: "java" | "python" | "cpp";
  durationMinutes?: number;
  topicsEmphasized?: string[];
  resumeText?: string;
  resumeProfileId?: string;
}

export const ROUND_NAMES: Record<RoundNumber, string> = {
  1: "Technical Fundamentals",
  2: "Advanced CS & Projects",
  3: "Coding Interview",
  4: "Behavioral & HR",
};

export const DEFAULT_ROUND_QUESTION_COUNT: Record<RoundNumber, number> = {
  1: 8,
  2: 8,
  3: 1, // 1 LeetCode-style problem
  4: 8,
};

export async function createSession(input: CreateInterviewInput) {
  await ensureDbInitialized();

  const sessionId = "session-" + Math.random().toString(36).substring(2, 10);
  const variant = input.interviewModeVariant || "full_mock";
  const title = input.title || `${input.companyProfile} ${input.targetRole} (${variant}) Interview`;
  let durationMinutes = input.durationMinutes || 60;
  if (variant === "pressure_interview") {
    durationMinutes = Math.min(durationMinutes, 30);
  }
  const now = new Date();

  let startingRound: RoundNumber = 1;
  if (variant === "advanced_technical") startingRound = 2;
  else if (variant === "coding_interview") startingRound = 3;
  else if (variant === "behavioral_hr") startingRound = 4;

  // Create session
  await db.insert(interviewSessions).values({
    id: sessionId,
    title,
    targetRole: input.targetRole,
    companyProfile: input.companyProfile,
    difficulty: input.difficulty,
    mode: input.mode,
    interviewModeVariant: variant,
    resumeProfileId: input.resumeProfileId || null,
    primaryLanguage: input.primaryLanguage || "java",
    durationMinutes,
    topicsEmphasized: JSON.stringify(input.topicsEmphasized || []),
    resumeText: input.resumeText || null,
    status: "in_progress",
    currentRound: startingRound,
    currentQuestionIndex: 0,
    timeRemainingSeconds: durationMinutes * 60,
    isPaused: false,
    startedAt: now,
    createdAt: now,
  });

  // Create 4 rounds
  for (let r = 1; r <= 4; r++) {
    await db.insert(interviewRounds).values({
      id: `round-${sessionId}-${r}`,
      sessionId,
      roundNumber: r as RoundNumber,
      roundName: ROUND_NAMES[r as RoundNumber],
      status: r === startingRound ? "in_progress" : r < startingRound ? "completed" : "pending",
      startedAt: r === startingRound ? now : null,
    });
  }

  // Pick first question for starting round
  const firstQuestion = await getNextQuestionForRound(sessionId, startingRound, 0, input);

  // Add welcome and initial question message
  const welcomeText = `Welcome to your ${input.companyProfile} Technical Interview for the ${input.targetRole} position.
Mode: ${variant.replace(/_/g, " ").toUpperCase()}.
I will be conducting your evaluation today. We will begin with Round ${startingRound}: ${ROUND_NAMES[startingRound]}.

Let's begin with your first question:
${firstQuestion.questionText}`;

  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: startingRound,
    sender: "interviewer",
    messageType: "question",
    content: welcomeText,
    metadata: JSON.stringify({ questionId: firstQuestion.id, questionIndex: 0 }),
    timestamp: now,
  });

  return { sessionId, title, firstQuestion };
}

export async function getNextQuestionForRound(
  sessionId: string,
  roundNumber: RoundNumber,
  questionIndex: number,
  sessionInput?: { companyProfile?: string; targetRole?: string; resumeText?: string; resumeProfileId?: string; interviewModeVariant?: string }
) {
  // 1. If in Round 2 and candidate has an attached resume profile with projects, ask progressively deeper questions about verified projects
  if (roundNumber === 2 && sessionInput?.resumeProfileId) {
    const [prof] = await db
      .select()
      .from(resumeProfiles)
      .where(eq(resumeProfiles.id, sessionInput.resumeProfileId));

    if (prof && prof.extractedProjects) {
      try {
        const projects = JSON.parse(prof.extractedProjects);
        if (projects.length > 0) {
          const proj = projects[questionIndex % projects.length];
          const progressive = generateProgressiveProjectQuestions(proj);
          const qText = questionIndex === 0
            ? progressive.architectureQuestion
            : questionIndex === 1
            ? progressive.tradeOffQuestion
            : progressive.reliabilityAndFailureQuestion;

          return {
            id: `proj-${proj.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 15)}-${questionIndex}`,
            category: "backend_api",
            topic: `Project Architecture: ${proj.name}`,
            difficulty: "medium",
            companyTags: JSON.stringify(["Project Discussion"]),
            questionText: qText,
            expectedAnswer: `Detailed explanation of ${proj.name} architecture, candidate personal contribution, trade-offs of ${proj.technologies.join(", ")}, and validation/failure handling.`,
            explanation: "Evaluates candidate's genuine engineering ownership, design trade-offs, and reliability testing.",
            followUps: JSON.stringify(["What was your biggest architectural bottleneck?"]),
            rubricFocus: "Project Knowledge & Architecture",
            createdAt: new Date(),
          };
        }
      } catch {
        // Fall back to question bank
      }
    }
  }

  // 2. If Revision Interview mode, query priority items from revision queue
  if (sessionInput?.interviewModeVariant === "revision_interview") {
    const revItems = await db.select().from(revisionQueue).limit(5);
    if (revItems.length > 0) {
      const rev = revItems[questionIndex % revItems.length];
      if (rev.questionId) {
        const [qRecord] = await db.select().from(questions).where(eq(questions.id, rev.questionId));
        if (qRecord) return qRecord;
      }
    }
  }

  // Query questions already asked in this session
  const answered = await db
    .select({ qId: candidateAnswers.questionId })
    .from(candidateAnswers)
    .where(eq(candidateAnswers.sessionId, sessionId));

  const askedIds = new Set(answered.map(a => a.qId).filter(Boolean));

  let categories: string[] = [];
  if (roundNumber === 1) {
    categories = ["java_oop", "dsa_concepts"];
  } else if (roundNumber === 2) {
    categories = ["dbms_sql", "os", "networks", "backend_api", "system_design"];
  } else if (roundNumber === 4) {
    categories = ["behavioral"];
  }

  // Fetch eligible questions from DB
  const allEligible = await db.select().from(questions);
  let filtered = allEligible.filter(q => categories.includes(q.category) && !askedIds.has(q.id));

  if (filtered.length === 0) {
    // Fallback if all asked
    filtered = allEligible.filter(q => categories.includes(q.category));
  }

  // Return best matching question
  const selected = filtered[questionIndex % Math.max(1, filtered.length)] || allEligible[0];
  return selected;
}

export async function submitCandidateAnswer(params: {
  sessionId: string;
  answerText: string;
}) {
  await ensureDbInitialized();
  const { sessionId, answerText } = params;

  // Fetch session
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));

  if (!session) throw new Error("Interview session not found.");
  if (session.status === "completed") throw new Error("Interview session already completed.");

  const currentRound = session.currentRound as RoundNumber;
  const currentIdx = session.currentQuestionIndex;

  // Get the most recent question asked in this round
  const recentMessages = await db
    .select()
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.sessionId, sessionId),
        eq(conversationMessages.roundNumber, currentRound)
      )
    )
    .orderBy(desc(conversationMessages.timestamp))
    .limit(10);

  const lastQuestionMsg = recentMessages.find(
    m => m.sender === "interviewer" && (m.messageType === "question" || m.messageType === "followup")
  );

  let questionText = "General Technical Question";
  let expectedAnswer = "Accurate technical explanation with appropriate trade-offs.";
  let questionId: string | undefined;

  if (lastQuestionMsg) {
    questionText = lastQuestionMsg.content;
    try {
      if (lastQuestionMsg.metadata) {
        const meta = JSON.parse(lastQuestionMsg.metadata);
        questionId = meta.questionId;
        if (questionId) {
          const [qRecord] = await db.select().from(questions).where(eq(questions.id, questionId));
          if (qRecord) {
            expectedAnswer = qRecord.expectedAnswer;
          }
        }
      }
    } catch {
      // metadata parse fallback
    }
  }

  // Record candidate message
  const now = new Date();
  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: currentRound,
    sender: "candidate",
    messageType: "answer",
    content: answerText,
    timestamp: now,
  });

  // Evaluate Answer via AI Provider
  const aiProvider = getAIProvider();
  const evaluation = await aiProvider.evaluateAnswer({
    context: {
      sessionId,
      roundNumber: currentRound,
      roundName: ROUND_NAMES[currentRound],
      companyProfile: session.companyProfile as CompanyProfile,
      targetRole: session.targetRole,
      difficulty: session.difficulty,
      mode: session.mode as InterviewMode,
      primaryLanguage: session.primaryLanguage,
      resumeText: session.resumeText || undefined,
      recentConversation: recentMessages.map(m => ({
        sender: m.sender as any,
        messageType: m.messageType,
        content: m.content,
      })),
    },
    questionText,
    expectedAnswer,
    candidateAnswer: answerText,
  });

  // Record candidate answer evaluation
  await db.insert(candidateAnswers).values({
    id: "ans-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: currentRound,
    questionId: questionId || null,
    questionText,
    answerText,
    evaluationScore: Math.round(evaluation.score),
    rubricBreakdown: JSON.stringify(evaluation.rubricScores),
    strengths: JSON.stringify(evaluation.strengths),
    weaknesses: JSON.stringify(evaluation.weaknesses),
    feedback: evaluation.feedback,
    createdAt: now,
  });

  // Determine Next Action in State Machine
  const maxQuestionsInRound = DEFAULT_ROUND_QUESTION_COUNT[currentRound];
  const nextQuestionIdx = currentIdx + 1;
  const isRoundFinished = nextQuestionIdx >= maxQuestionsInRound;

  let interviewerReply = "";
  let nextRound = currentRound;
  let nextIdx = nextQuestionIdx;
  let isInterviewComplete = false;

  if (session.mode === "practice") {
    // In practice mode, provide immediate formative feedback
    interviewerReply += `[Feedback: Score ${evaluation.score}/100]\n${evaluation.feedback}\n\n`;

    // Immediate communication coaching in Practice Mode
    const commIssue = evaluateSingleTurnCommunication(answerText);
    if (commIssue) {
      interviewerReply += `💡 [Communication Tip]: In "${commIssue.submittedSentence}", note: ${commIssue.reason}. Try phrasing it as: "${commIssue.improvedInterviewVersion || commIssue.correctedSentence}".\n\n`;
    }
  }

  // Audit API usage
  await logAPIUsage({
    service: isLiveAIConfigured() ? "groq_ai" : "system",
    endpoint: "/api/interviews/answer",
    modelOrLang: process.env.GROQ_MODEL || "deterministic-engine",
    status: "success",
    responseTimeMs: Math.max(10, Date.now() - now.getTime()),
    promptTokensEst: Math.round((questionText.length + answerText.length) / 4),
    completionTokensEst: Math.round(evaluation.feedback.length / 4),
  });

  if (isRoundFinished) {
    // Complete current round
    await completeRound(sessionId, currentRound);

    if (currentRound < 4) {
      nextRound = (currentRound + 1) as RoundNumber;
      nextIdx = 0;

      // Update session to next round
      await db
        .update(interviewSessions)
        .set({
          currentRound: nextRound,
          currentQuestionIndex: 0,
        })
        .where(eq(interviewSessions.id, sessionId));

      await db
        .update(interviewRounds)
        .set({
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(
          and(
            eq(interviewRounds.sessionId, sessionId),
            eq(interviewRounds.roundNumber, nextRound)
          )
        );

      if (nextRound === 3) {
        // Coding Round presentation
        const [problem] = await db.select().from(codingProblems).limit(1);
        interviewerReply += `Great effort in Round ${currentRound}! We are now transitioning to Round 3: Coding Interview.\n\n` +
          `Your coding challenge is: **${problem.title}** (${problem.difficulty.toUpperCase()}).\n\n` +
          `${problem.description}\n\n` +
          `Before writing code, explain your algorithmic approach and expected time/space complexity, or switch to the code editor pane when ready.`;

        await db.insert(conversationMessages).values({
          id: "msg-" + Math.random().toString(36).substring(2, 10),
          sessionId,
          roundNumber: 3,
          sender: "interviewer",
          messageType: "question",
          content: interviewerReply,
          metadata: JSON.stringify({ problemId: problem.id, problemSlug: problem.slug }),
          timestamp: new Date(),
        });

        return {
          evaluation,
          interviewerReply,
          roundCompleted: true,
          nextRound: 3,
          isInterviewComplete: false,
        };
      } else {
        // Round 2 or Round 4 Next Question
        const nextQ = await getNextQuestionForRound(sessionId, nextRound, 0);
        interviewerReply += `That concludes Round ${currentRound}. Proceeding to Round ${nextRound}: ${ROUND_NAMES[nextRound]}.\n\n` +
          `Question 1:\n${nextQ.questionText}`;

        await db.insert(conversationMessages).values({
          id: "msg-" + Math.random().toString(36).substring(2, 10),
          sessionId,
          roundNumber: nextRound,
          sender: "interviewer",
          messageType: "question",
          content: interviewerReply,
          metadata: JSON.stringify({ questionId: nextQ.id, questionIndex: 0 }),
          timestamp: new Date(),
        });

        return {
          evaluation,
          interviewerReply,
          roundCompleted: true,
          nextRound,
          isInterviewComplete: false,
        };
      }
    } else {
      // Finished Round 4 -> Entire Interview Complete!
      isInterviewComplete = true;
      interviewerReply += `Thank you! You have completed all four rounds of the ${session.companyProfile} software engineering interview. Generating your comprehensive hiring evaluation and final report now...`;

      await finishSession(sessionId);

      await db.insert(conversationMessages).values({
        id: "msg-" + Math.random().toString(36).substring(2, 10),
        sessionId,
        roundNumber: 4,
        sender: "interviewer",
        messageType: "instruction",
        content: interviewerReply,
        timestamp: new Date(),
      });

      return {
        evaluation,
        interviewerReply,
        roundCompleted: true,
        nextRound: 4,
        isInterviewComplete: true,
      };
    }
  } else {
    // Round continues: ask next question in current round
    await db
      .update(interviewSessions)
      .set({
        currentQuestionIndex: nextQuestionIdx,
      })
      .where(eq(interviewSessions.id, sessionId));

    const nextQ = await getNextQuestionForRound(sessionId, currentRound, nextQuestionIdx);
    interviewerReply += `Thank you for your response. Let's move to Question ${nextQuestionIdx + 1}:\n\n${nextQ.questionText}`;

    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: currentRound,
      sender: "interviewer",
      messageType: "question",
      content: interviewerReply,
      metadata: JSON.stringify({ questionId: nextQ.id, questionIndex: nextQuestionIdx }),
      timestamp: new Date(),
    });

    return {
      evaluation,
      interviewerReply,
      roundCompleted: false,
      nextRound: currentRound,
      isInterviewComplete: false,
    };
  }
}

export async function askInterviewerQuestion(params: {
  sessionId: string;
  candidateQuestion: string;
}) {
  await ensureDbInitialized();
  const { sessionId, candidateQuestion } = params;

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));

  if (!session) throw new Error("Interview session not found.");

  const currentRound = session.currentRound as RoundNumber;

  // Record candidate question without advancing index
  const now = new Date();
  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: currentRound,
    sender: "candidate",
    messageType: "clarification_question",
    content: candidateQuestion,
    timestamp: now,
  });

  // Get active question
  const recentMsgs = await db
    .select()
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.sessionId, sessionId),
        eq(conversationMessages.roundNumber, currentRound)
      )
    )
    .orderBy(desc(conversationMessages.timestamp))
    .limit(5);

  const activeQuestionMsg = recentMsgs.find(m => m.sender === "interviewer" && m.messageType === "question");
  const currentQuestionText = activeQuestionMsg?.content || "Current Technical Problem";

  // Answer via AI without revealing solution
  const aiProvider = getAIProvider();
  const clarification = await aiProvider.answerCandidateQuestion({
    context: {
      sessionId,
      roundNumber: currentRound,
      roundName: ROUND_NAMES[currentRound],
      companyProfile: session.companyProfile as CompanyProfile,
      targetRole: session.targetRole,
      difficulty: session.difficulty,
      mode: session.mode as InterviewMode,
      primaryLanguage: session.primaryLanguage,
      resumeText: session.resumeText || undefined,
      recentConversation: recentMsgs.map(m => ({
        sender: m.sender as any,
        messageType: m.messageType,
        content: m.content,
      })),
    },
    currentQuestionText,
    candidateQuestion,
  });

  // Save interviewer reply
  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: currentRound,
    sender: "interviewer",
    messageType: "clarification_answer",
    content: clarification.message,
    timestamp: new Date(),
  });

  return clarification;
}

export async function completeRound(sessionId: string, roundNumber: RoundNumber) {
  // Aggregate scores for this round
  const answers = await db
    .select()
    .from(candidateAnswers)
    .where(
      and(
        eq(candidateAnswers.sessionId, sessionId),
        eq(candidateAnswers.roundNumber, roundNumber)
      )
    );

  let roundScore = 70; // baseline
  if (answers.length > 0) {
    const totalScore = answers.reduce((sum, a) => sum + (a.evaluationScore || 0), 0);
    roundScore = Math.round(totalScore / answers.length);
  }

  const now = new Date();
  await db
    .update(interviewRounds)
    .set({
      status: "completed",
      score: roundScore,
      completedAt: now,
      roundFeedback: `Completed ${ROUND_NAMES[roundNumber]} with an average performance index of ${roundScore}/100.`,
    })
    .where(
      and(
        eq(interviewRounds.sessionId, sessionId),
        eq(interviewRounds.roundNumber, roundNumber)
      )
    );
}

export async function finishSession(sessionId: string) {
  await ensureDbInitialized();

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));

  if (!session) throw new Error("Session not found");

  // Get rounds
  const rounds = await db
    .select()
    .from(interviewRounds)
    .where(eq(interviewRounds.sessionId, sessionId));

  // Get answers
  const answers = await db
    .select()
    .from(candidateAnswers)
    .where(eq(candidateAnswers.sessionId, sessionId));

  // Get code submissions
  const submissions = await db
    .select()
    .from(codeSubmissions)
    .where(eq(codeSubmissions.sessionId, sessionId));

  // Calculate overall score (average of completed rounds)
  const completedRounds = rounds.filter(r => r.score !== null);
  const overallScore = completedRounds.length > 0
    ? Math.round(completedRounds.reduce((sum, r) => sum + (r.score || 0), 0) / completedRounds.length)
    : 65;

  const aiProvider = getAIProvider();
  const reportData = await aiProvider.generateFinalReport({
    context: {
      sessionId,
      roundNumber: 4,
      roundName: "Final Hiring Evaluation",
      companyProfile: session.companyProfile as CompanyProfile,
      targetRole: session.targetRole,
      difficulty: session.difficulty,
      mode: session.mode as InterviewMode,
      primaryLanguage: session.primaryLanguage,
      resumeText: session.resumeText || undefined,
      recentConversation: [],
    },
    answers: answers.map(a => ({
      roundNumber: a.roundNumber as RoundNumber,
      questionText: a.questionText,
      answerText: a.answerText,
      evaluationScore: a.evaluationScore,
      feedback: a.feedback,
    })),
    codingSubmissions: submissions.map(s => ({
      problemTitle: s.problemId,
      status: s.status,
      passed: s.passedTests,
      total: s.totalTests,
    })),
  });

  const now = new Date();

  // 1. Evaluate candidate English communication & grammar
  const candidateTranscripts = answers.map(a => a.answerText);
  const communicationReport = evaluateCandidateCommunication(candidateTranscripts);

  // 2. Compute 16 independent skill radar analysis
  const skillRadar = computeSkillRadarAnalysis({
    candidateAnswers: answers.map(a => ({
      roundNumber: a.roundNumber,
      questionText: a.questionText,
      answerText: a.answerText,
      evaluationScore: a.evaluationScore,
      strengths: a.strengths ? JSON.parse(a.strengths) : [],
      weaknesses: a.weaknesses ? JSON.parse(a.weaknesses) : [],
    })),
    codeSubmissions: submissions.map(s => ({
      language: s.language,
      status: s.status,
      passedTests: s.passedTests,
      totalTests: s.totalTests,
      code: s.code,
    })),
    communicationReport,
  });

  // 3. Compile detailed coding reports
  const allProblems = await db.select().from(codingProblems);
  const detailedCodingReports = submissions.map(s => {
    const prob = allProblems.find(p => p.id === s.problemId || p.slug === s.problemId);
    return {
      problemId: s.problemId,
      problemTitle: prob?.title || "Coding Challenge",
      difficulty: prob?.difficulty || "medium",
      problemStatement: prob?.description || "Implement the requested algorithm.",
      spokenApproach: answers.find(a => a.roundNumber === 3)?.answerText || "Approach explained during live coding session.",
      submittedCode: s.code,
      language: s.language,
      compilerStatus: s.status,
      testsPassed: s.passedTests,
      totalTests: s.totalTests,
      runtimeMs: s.runtimeMs ?? undefined,
      memoryKb: s.memoryKb ?? undefined,
      timeComplexityClaimed: prob?.timeComplexity || "O(N)",
      spaceComplexityClaimed: prob?.spaceComplexity || "O(1)",
      edgeCasesMissed: s.passedTests < s.totalTests ? ["Boundary value checking", "Empty input handling"] : [],
      codeQualityAssessment: s.status === "accepted" ? "Clean structure with verified test completion." : "Encountered compiler or logical test-case issues.",
      correctnessAssessment: s.status === "accepted" ? "Verified correct on compiler test harness." : `Failed ${s.totalTests - s.passedTests} test cases.`,
      preferredApproachExplanation: prob?.referenceSolutionJava ? "Optimal solution using optimal data structure and pointer technique." : "Optimized approach.",
      optimizedSolutionCode: prob?.referenceSolutionJava || s.code,
      practiceRecommendations: [
        `Practice similar ${prob?.difficulty || "medium"} difficulty problems on algorithmic patterns.`,
        "Always write edge case checks before running test runs.",
      ],
    };
  });

  // Generate comprehensive 7-section markdown export
  const markdownExport = `# InterviewForge AI — Candidate Evaluation Report (Comprehensive Dossier)

**Candidate Target Role:** ${session.targetRole}  
**Company Profile:** ${session.companyProfile}  
**Evaluation Mode:** ${session.mode.toUpperCase()}  
**Interview Date:** ${now.toLocaleDateString()}  
**Overall Performance Score:** ${overallScore}/100 — **${reportData.readinessLevel}**

---

## Section A: Interview Summary
- **Total Duration:** ${session.durationMinutes} minutes scheduled
- **Status:** Completed
- **Readiness Verdict:** ${reportData.readinessLevel}
- **Executive Summary:** ${reportData.readinessSummary}

### Round Breakdown:
${rounds
  .map(
    r => `- **Round ${r.roundNumber} (${r.roundName}):** ${r.score !== null ? `${r.score}/100` : "Incomplete"} — ${r.status}`
  )
  .join("\n")}

---

## Section B: Technical Assessment (Question-by-Question)
${answers
  .filter(a => a.roundNumber !== 4)
  .map(
    (a, idx) => `### Question ${idx + 1} (Round ${a.roundNumber})
- **Question:** ${a.questionText}
- **Candidate Answer Transcript:** "${a.answerText}"
- **Score:** ${a.evaluationScore !== null ? `${a.evaluationScore}/100` : "N/A"}
- **Feedback:** ${a.feedback || "Good technical attempt."}
`
  )
  .join("\n")}

---

## Section C: Coding Assessment & Compiler Execution
${
  detailedCodingReports.length > 0
    ? detailedCodingReports
        .map(
          c => `### Problem: ${c.problemTitle} (${c.difficulty.toUpperCase()})
- **Spoken Approach Explained:** ${c.spokenApproach}
- **Compiler Execution Status:** **${c.compilerStatus.toUpperCase()}**
- **Test Cases Passed:** ${c.testsPassed} / ${c.totalTests} tests
- **Time / Space Complexity:** ${c.timeComplexityClaimed} / ${c.spaceComplexityClaimed}
- **Code Quality Assessment:** ${c.codeQualityAssessment}
- **Correctness Verdict:** ${c.correctnessAssessment}

\`\`\`${c.language}
${c.submittedCode}
\`\`\`
`
        )
        .join("\n")
    : "No coding problems submitted in this session."
}

---

## Section D: English Grammar & Communication Report
- **Overall Communication Score:** ${communicationReport.overallScore}/100
- **Grammar & Sentence Construction:** ${communicationReport.grammarScore}/100
- **Clarity & Articulation:** ${communicationReport.clarityScore}/100
- **Technical Explanation Depth:** ${communicationReport.technicalExplanationScore}/100
- **Filler Word Count:** ${communicationReport.fillerWordCount} filler words detected

### Grammatical & Phrasing Observations:
${
  communicationReport.issues.length > 0
    ? communicationReport.issues
        .map(
          (iss, i) => `#### Issue ${i + 1}: ${iss.identifiedIssue}
- **Submitted Sentence:** "${iss.submittedSentence}"
- **Grammatical Correction:** "${iss.correctedSentence}"
- **Reason:** ${iss.reason}
- **Interview-Ready Phrasing:** "${iss.improvedInterviewVersion || iss.correctedSentence}"
`
        )
        .join("\n")
    : "- No significant grammatical issues detected in candidate transcripts."
}

> *Note on Speech Recognition:* ${communicationReport.disclaimer}

---

## Section E: Behavioral & HR Assessment (STAR Framework)
${
  answers.filter(a => a.roundNumber === 4).length > 0
    ? answers
        .filter(a => a.roundNumber === 4)
        .map(
          a => `### ${a.questionText}
- **Transcript:** "${a.answerText}"
- **Evaluation:** ${a.feedback || "Evaluated against behavioral indicators."}
`
        )
        .join("\n")
    : "- Behavioral round was not attempted in this session."
}

---

## Section F: Skill Radar & Weakness Analysis (16 Evaluated Categories)
${skillRadar.skills
  .map(
    s => `- **${s.label}:** ${s.assessed ? `${s.score}/100` : "*Not Assessed*"} — ${s.strengthOrWeakness} (${s.action})`
  )
  .join("\n")}

- **Primary Weakness Root Cause:** ${
  skillRadar.gapOrigin.knowledgeGap
    ? "Knowledge Gap (requires reviewing theory)"
    : skillRadar.gapOrigin.reasoningGap
    ? "Reasoning Gap (requires problem-solving practice)"
    : skillRadar.gapOrigin.implementationGap
    ? "Implementation Gap (requires compiler coding practice)"
    : "Communication Gap (requires structured verbal articulation)"
}

---

## Section G: Personalized 7-Day Targeted Practice Plan
${reportData.sevenDayPlan
  .map(
    p => `### Day ${p.day}: ${p.focus}
${p.tasks.map(t => `- ${t}`).join("\n")}`
  )
  .join("\n\n")}

---
*InterviewForge AI — Evidence-Based Engineering Hiring Evaluation*
`;

  // Insert report record with complete structured data
  const reportId = "report-" + Math.random().toString(36).substring(2, 10);
  await db.insert(interviewReports).values({
    id: reportId,
    sessionId,
    overallScore,
    roundScores: JSON.stringify(rounds.map(r => ({ round: r.roundNumber, name: r.roundName, score: r.score }))),
    technicalStrengths: JSON.stringify(reportData.technicalStrengths),
    areasForImprovement: JSON.stringify(reportData.areasForImprovement),
    communicationAssessment: JSON.stringify(communicationReport),
    codingAssessment: JSON.stringify({
      summary: reportData.codingAssessmentSummary,
      submissionsCount: submissions.length,
      detailedCodingReports,
      skillRadar,
    }),
    sevenDayPlan: JSON.stringify(reportData.sevenDayPlan),
    readinessSummary: reportData.readinessSummary,
    readinessLevel: reportData.readinessLevel,
    markdownExport,
    createdAt: now,
  });

  // Mark session completed
  await db
    .update(interviewSessions)
    .set({
      status: "completed",
      totalScore: overallScore,
      completedAt: now,
    })
    .where(eq(interviewSessions.id, sessionId));

  // Sync persistent candidate skills profile and spaced-repetition revision queue
  try {
    await updateSkillsProfileFromSession(sessionId);
    await syncRevisionQueueFromSession(sessionId);
  } catch (syncErr) {
    console.error("Skills / Revision queue sync error:", syncErr);
  }

  return { reportId, overallScore, reportData, markdownExport };
}
