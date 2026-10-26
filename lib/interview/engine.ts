import { db, ensureDbInitialized, sqliteClient } from "../db";
import {
  interviewSessions,
  interviewRounds,
  conversationMessages,
  candidateAnswers,
  codeSubmissions,
  questions,
  codingProblems,
  interviewReports,
} from "../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getAIProvider, isLiveAIConfigured } from "../ai";
import {
  CompanyProfile,
  InterviewMode,
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

export interface CreateInterviewInput {
  title?: string;
  targetRole: string;
  companyProfile: CompanyProfile;
  difficulty: "fresher" | "entry_level" | "intermediate" | "experienced";
  mode: InterviewMode;
  primaryLanguage?: "java" | "python" | "cpp";
  durationMinutes?: number;
  topicsEmphasized?: string[];
  resumeText?: string;
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
  const title = input.title || `${input.companyProfile} ${input.targetRole} Interview`;
  const durationMinutes = input.durationMinutes || 60;
  const now = new Date();

  // Create session
  await db.insert(interviewSessions).values({
    id: sessionId,
    title,
    targetRole: input.targetRole,
    companyProfile: input.companyProfile,
    difficulty: input.difficulty,
    mode: input.mode,
    primaryLanguage: input.primaryLanguage || "java",
    durationMinutes,
    topicsEmphasized: JSON.stringify(input.topicsEmphasized || []),
    resumeText: input.resumeText || null,
    status: "in_progress",
    currentRound: 1,
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
      status: r === 1 ? "in_progress" : "pending",
      startedAt: r === 1 ? now : null,
    });
  }

  // Pick first question for Round 1
  const firstQuestion = await getNextQuestionForRound(sessionId, 1, 0, input);

  // Add welcome and initial question message
  const welcomeText = `Welcome to your ${input.companyProfile} Technical Interview for the ${input.targetRole} position.
I will be conducting your 4-round technical and behavioral evaluation today.
We will begin with Round 1: ${ROUND_NAMES[1]}.

Let's begin with your first question:
${firstQuestion.questionText}`;

  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: 1,
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
  sessionInput?: { companyProfile?: string; targetRole?: string; resumeText?: string }
) {
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
    evaluationScore: evaluation.score,
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
  }

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

  // Generate markdown export
  const markdownExport = `# InterviewForge AI — Candidate Evaluation Report

**Role:** ${session.targetRole}  
**Company Profile:** ${session.companyProfile}  
**Date:** ${now.toLocaleDateString()}  
**Overall Readiness Score:** ${overallScore}/100 — **${reportData.readinessLevel}**

---

## 1. Executive Summary
${reportData.readinessSummary}

## 2. Round-by-Round Breakdown
${rounds
  .map(
    r => `### Round ${r.roundNumber}: ${r.roundName}
- **Status:** ${r.status}
- **Score:** ${r.score !== null ? `${r.score}/100` : "Incomplete"}
- **Feedback:** ${r.roundFeedback || "N/A"}`
  )
  .join("\n\n")}

## 3. Technical Strengths
${reportData.technicalStrengths.map(s => `- ${s}`).join("\n")}

## 4. Areas for Improvement
${reportData.areasForImprovement.map(a => `- ${a}`).join("\n")}

## 5. Communication & Behavioral Assessment
${reportData.communicationAssessment}

## 6. 7-Day Targeted Practice Plan
${reportData.sevenDayPlan
  .map(
    p => `### Day ${p.day}: ${p.focus}
${p.tasks.map(t => `- ${t}`).join("\n")}`
  )
  .join("\n\n")}

---
*Generated by InterviewForge AI*
`;

  // Insert report record
  const reportId = "report-" + Math.random().toString(36).substring(2, 10);
  await db.insert(interviewReports).values({
    id: reportId,
    sessionId,
    overallScore,
    roundScores: JSON.stringify(rounds.map(r => ({ round: r.roundNumber, name: r.roundName, score: r.score }))),
    technicalStrengths: JSON.stringify(reportData.technicalStrengths),
    areasForImprovement: JSON.stringify(reportData.areasForImprovement),
    communicationAssessment: reportData.communicationAssessment,
    codingAssessment: JSON.stringify({ summary: reportData.codingAssessmentSummary, submissionsCount: submissions.length }),
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

  return { reportId, overallScore, reportData, markdownExport };
}
