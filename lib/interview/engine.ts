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
  interviewBlueprints,
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
import { parseResumeStructured } from "../intelligence/resume-parser";
import { generateInterviewBlueprint, getBlueprintForSession, TECH_INTERVIEW_TREES } from "../intelligence/blueprint-generator";
import { compileResumeAssessmentDossier } from "../intelligence/resume-report-generator";
import { STATIC_QUESTIONS } from "../fallback/data-source";
import { selectRandomCodingProblem } from "./coding-selector";

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
  jobDescription?: string;
}

export const ROUND_NAMES: Record<RoundNumber, string> = {
  1: "Technical Fundamentals",
  2: "Advanced CS & Projects",
  3: "Coding Interview",
  4: "Behavioral & HR",
};

export const DEFAULT_ROUND_QUESTION_COUNT: Record<RoundNumber, number> = {
  1: 4, // 3-4 questions in Technical Fundamentals
  2: 4, // 3-4 questions in Advanced CS & Projects
  3: 1, // Coding Interview (with problem switcher)
  4: 3, // 3-4 questions in Behavioral & HR
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

  // 1. Automatically generate Interview Blueprint if resumeText or resumeProfileId exists
  let detectedPrimaryLanguage: "java" | "python" | "cpp" = input.primaryLanguage || "java";
  let activeProfileId = input.resumeProfileId || null;
  let parsedProfileData: any = null;

  if (input.resumeText && !activeProfileId) {
    const parseRes = parseResumeStructured(input.resumeText);
    if (parseRes.success) {
      activeProfileId = "prof-" + Math.random().toString(36).substring(2, 10);
      parsedProfileData = parseRes.profile;
      const flattened = [
        ...parseRes.profile.skills.programmingLanguages,
        ...parseRes.profile.skills.frontend,
        ...parseRes.profile.skills.backend,
        ...parseRes.profile.skills.databases,
        ...parseRes.profile.skills.aiMl,
        ...parseRes.profile.skills.devops,
        ...parseRes.profile.skills.testing,
      ];
      await db.insert(resumeProfiles).values({
        id: activeProfileId,
        candidateName: parseRes.profile.name || "Candidate",
        targetRole: input.targetRole,
        experienceLevel: input.difficulty,
        rawResumeText: input.resumeText,
        rawJobDescription: input.jobDescription || null,
        extractedSkills: JSON.stringify(flattened),
        extractedProjects: JSON.stringify(parseRes.profile.projects),
        extractedTechnologies: JSON.stringify(flattened),
        extractedTopics: JSON.stringify(flattened.slice(0, 8)),
        jobRequirements: JSON.stringify([]),
        createdAt: now,
        updatedAt: now,
      });
    }
  } else if (activeProfileId) {
    const [pRecord] = await db.select().from(resumeProfiles).where(eq(resumeProfiles.id, activeProfileId));
    if (pRecord && pRecord.rawResumeText) {
      const parseRes = parseResumeStructured(pRecord.rawResumeText);
      if (parseRes.success) {
        parsedProfileData = parseRes.profile;
      }
    }
  }

  // Create session first so foreign key constraints on sessionId are satisfied
  await db.insert(interviewSessions).values({
    id: sessionId,
    title,
    targetRole: input.targetRole,
    companyProfile: input.companyProfile,
    difficulty: input.difficulty,
    mode: input.mode,
    interviewModeVariant: variant,
    resumeProfileId: activeProfileId,
    primaryLanguage: detectedPrimaryLanguage,
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

  // Generate and insert interview blueprint now that interview_sessions record exists
  if (parsedProfileData && activeProfileId) {
    try {
      const bp = await generateInterviewBlueprint({
        sessionId,
        resumeProfileId: activeProfileId,
        profile: parsedProfileData,
        targetRole: input.targetRole,
        companyProfile: input.companyProfile,
        jobDescription: input.jobDescription,
      });
      if (bp.primaryLanguage && !input.primaryLanguage) {
        detectedPrimaryLanguage = (bp.primaryLanguage === "javascript" ? "python" : bp.primaryLanguage) as any;
        await db.update(interviewSessions)
          .set({ primaryLanguage: detectedPrimaryLanguage })
          .where(eq(interviewSessions.id, sessionId));
      }
    } catch (bpErr) {
      console.warn("Blueprint generation error, continuing with default syllabus:", bpErr);
    }
  }

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
  let firstQuestion: any = null;
  let welcomeText = "";
  let messageMetadata: any = {};

  if (startingRound === 3) {
    const prob = await selectRandomCodingProblem({
      companyProfile: input.companyProfile,
      difficulty: input.difficulty,
    });
    firstQuestion = {
      id: prob.id,
      category: "dsa_concepts",
      topic: prob.title,
      difficulty: prob.difficulty,
      companyTags: JSON.stringify([input.companyProfile]),
      questionText: `Your coding challenge is: **${prob.title}** (${prob.difficulty.toUpperCase()}).\n\n${prob.description}\n\nExplain your algorithmic approach aloud and write your code in the editor pane when ready.`,
      expectedAnswer: `Optimal algorithmic solution for ${prob.title}.`,
      explanation: prob.description,
      followUps: JSON.stringify(prob.hints || []),
      rubricFocus: "Algorithmic Problem Solving",
      createdAt: now,
    };
    welcomeText = `Welcome to your ${input.companyProfile} Coding Interview for the ${input.targetRole} position.\nMode: ${variant.replace(/_/g, " ").toUpperCase()}.\n\n` +
      `Your coding challenge is: **${prob.title}** (${prob.difficulty.toUpperCase()}).\n\n` +
      `${prob.description}\n\n` +
      `Explain your algorithmic approach aloud and write your code in the editor pane when ready.`;
    messageMetadata = { problemId: prob.id, problemSlug: prob.slug, questionIndex: 0 };
  } else {
    firstQuestion = await getNextQuestionForRound(sessionId, startingRound, 0, {
      ...input,
      resumeProfileId: activeProfileId || undefined,
    });

    if (!firstQuestion || !firstQuestion.questionText) {
      firstQuestion = {
        id: "java-01",
        category: "java_oop",
        topic: "Java Fundamentals",
        difficulty: "easy",
        companyTags: JSON.stringify(["TCS", "Capgemini", "Service-Based General"]),
        questionText: "What is the difference between JDK, JRE, and JVM in Java?",
        expectedAnswer: "JVM executes bytecode; JRE contains JVM and runtime libraries; JDK contains JRE plus development tools.",
        explanation: "Foundational computer science principles.",
        followUps: JSON.stringify(["Can you provide a practical example?"]),
        rubricFocus: "Java Core Knowledge",
        createdAt: now,
      } as any;
    }

    welcomeText = `Welcome to your ${input.companyProfile} Technical Interview for the ${input.targetRole} position.
Mode: ${variant.replace(/_/g, " ").toUpperCase()}.
I will be conducting your evaluation today. We will begin with Round ${startingRound}: ${ROUND_NAMES[startingRound]}.

Let's begin with your first question:
${firstQuestion.questionText}`;
    messageMetadata = { questionId: firstQuestion.id, questionIndex: 0 };
  }

  await db.insert(conversationMessages).values({
    id: "msg-" + Math.random().toString(36).substring(2, 10),
    sessionId,
    roundNumber: startingRound,
    sender: "interviewer",
    messageType: "question",
    content: welcomeText,
    metadata: JSON.stringify(messageMetadata),
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
  // Check for persistent Interview Blueprint
  const blueprint = await getBlueprintForSession(sessionId);

  // 1. ROUND 1: Technical Fundamentals based on candidate's actual extracted stack
  if (roundNumber === 1 && blueprint && blueprint.primaryStack.length > 0) {
    const techCount = blueprint.primaryStack.length;
    const targetTech = blueprint.primaryStack[questionIndex % techCount];

    // Find questions in technology progression tree
    const tree = TECH_INTERVIEW_TREES[targetTech] ||
      (targetTech.toLowerCase().includes("react") ? TECH_INTERVIEW_TREES["React"] :
       targetTech.toLowerCase().includes("node") ? TECH_INTERVIEW_TREES["Node.js"] :
       targetTech.toLowerCase().includes("mongo") ? TECH_INTERVIEW_TREES["MongoDB"] :
       targetTech.toLowerCase().includes("python") || targetTech.toLowerCase().includes("ai") ? TECH_INTERVIEW_TREES["Python"] :
       targetTech.toLowerCase().includes("java") || targetTech.toLowerCase().includes("spring") ? TECH_INTERVIEW_TREES["Java"] :
       targetTech.toLowerCase().includes("postgres") ? TECH_INTERVIEW_TREES["PostgreSQL"] : null);

    if (tree && tree.length > 0) {
      const randomOffset = Math.floor(Math.random() * tree.length);
      const qIndex = (questionIndex + randomOffset) % tree.length;
      const qText = tree[qIndex] || tree[0];
      return {
        id: `resume-bp-r1-${targetTech.toLowerCase().replace(/[^a-z0-9]/g, "")}-${questionIndex}`,
        category: "frontend",
        topic: `${targetTech} Fundamentals`,
        difficulty: "medium",
        companyTags: JSON.stringify(["Resume Evaluation", targetTech]),
        questionText: qText,
        expectedAnswer: `Accurate explanation of ${targetTech} core mechanics, lifecycle, trade-offs, and practical execution.`,
        explanation: `Evaluates fundamental knowledge of candidate's verified resume skill: ${targetTech}.`,
        followUps: JSON.stringify(["What edge cases or bottlenecks could arise?"]),
        rubricFocus: `${targetTech} Core Knowledge`,
        createdAt: new Date(),
      };
    }
  }

  // 2. ROUND 2: Advanced CS & Project Deep Dive (Architecture, personal contribution, trade-offs, failures)
  if (roundNumber === 2 && (sessionInput?.resumeProfileId || blueprint?.resumeProfileId)) {
    const profileId = sessionInput?.resumeProfileId || blueprint?.resumeProfileId;
    const [prof] = await db
      .select()
      .from(resumeProfiles)
      .where(eq(resumeProfiles.id, profileId!));

    if (prof && prof.extractedProjects) {
      try {
        const projects = JSON.parse(prof.extractedProjects);
        if (projects.length > 0) {
          const proj = projects[questionIndex % projects.length];
          const progressive = generateProgressiveProjectQuestions(proj);

          let qText = "";
          if (questionIndex === 0) {
            qText = progressive.architectureQuestion;
          } else if (questionIndex === 1) {
            qText = progressive.tradeOffQuestion;
          } else if (questionIndex === 2) {
            qText = progressive.reliabilityAndFailureQuestion;
          } else {
            // Verify specific claims
            const claims = blueprint?.resumeClaims || [];
            const claimItem = claims.find(c => c.sourceSection === "Projects" || c.priority === "high");
            qText = claimItem
              ? `You claimed "${claimItem.claim}" in your project description. How did you specifically measure or validate this achievement, and what was your personal implementation role?`
              : `In ${proj.name}, what would you re-architect today if user traffic increased by 100x?`;
          }

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

  // 3. ROUND 4: Behavioral & HR (Grounded in candidate's real projects and internships)
  if (roundNumber === 4 && blueprint && blueprint.resumeClaims.length > 0) {
    const claims = blueprint.resumeClaims;
    if (questionIndex === 0) {
      return {
        id: `resume-hr-collab-${questionIndex}`,
        category: "behavioral",
        topic: "Team Collaboration & Conflict",
        difficulty: "medium",
        companyTags: JSON.stringify(["HR Round"]),
        questionText: `Tell me about a time in your projects or internships when you encountered an architectural disagreement or conflicting technical priority with a teammate or mentor. How did you handle it?`,
        expectedAnswer: "Candidate uses STAR structure (Situation, Task, Action, Result) demonstrating professional communication, empathy, and data-driven compromise.",
        explanation: "Assesses teamwork and interpersonal conflict resolution.",
        followUps: JSON.stringify(["What would you do differently today?"]),
        rubricFocus: "Collaboration & STAR Structure",
        createdAt: new Date(),
      };
    } else if (questionIndex === 1) {
      return {
        id: `resume-hr-failure-${questionIndex}`,
        category: "behavioral",
        topic: "Failure & Learning",
        difficulty: "medium",
        companyTags: JSON.stringify(["HR Round"]),
        questionText: `Can you describe a significant technical mistake, broken deployment, or edge-case failure you personally experienced in your code, and what systemic changes you implemented afterwards?`,
        expectedAnswer: "Demonstrates genuine ownership, root-cause reflection, resilience, and actionable preventive measures.",
        explanation: "Assesses accountability and continuous learning.",
        followUps: JSON.stringify(["How did you communicate the issue to stakeholders?"]),
        rubricFocus: "Ownership & Accountability",
        createdAt: new Date(),
      };
    }
  }

  // 4. If Revision Interview mode, query priority items from revision queue
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

  // Fetch eligible questions from DB or fallback
  let allEligible: any[] = [];
  if (process.env.DATABASE_URL) {
    try {
      allEligible = await db.select().from(questions);
    } catch {
      allEligible = [];
    }
  }

  if (allEligible.length === 0) {
    allEligible = STATIC_QUESTIONS.map(q => ({
      id: q.id,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      companyTags: JSON.stringify(q.companyTags || []),
      questionText: q.questionText,
      expectedAnswer: q.expectedAnswer,
      explanation: q.explanation,
      followUps: JSON.stringify(q.followUps || []),
      rubricFocus: q.rubricFocus || null,
      createdAt: new Date(),
    }));
  }

  let filtered = allEligible.filter(q => categories.includes(q.category) && !askedIds.has(q.id));

  if (filtered.length === 0) {
    // Fallback if all asked
    filtered = allEligible.filter(q => categories.includes(q.category));
  }

  // Filter by target company profile (TCS, Capgemini, Service-Based, Product-Based, etc.)
  const targetCompany = sessionInput?.companyProfile;
  if (targetCompany && filtered.length > 0) {
    const companyMatches = filtered.filter(q => {
      try {
        const tags = typeof q.companyTags === "string" ? JSON.parse(q.companyTags) : q.companyTags;
        if (!Array.isArray(tags)) return false;
        if (targetCompany === "TCS") {
          return tags.includes("TCS") || tags.includes("Service-Based General");
        }
        if (targetCompany === "Capgemini") {
          return tags.includes("Capgemini") || tags.includes("Service-Based General");
        }
        if (targetCompany === "Service-Based General") {
          return tags.includes("TCS") || tags.includes("Capgemini") || tags.includes("Service-Based General");
        }
        if (targetCompany === "Product-Based Engineering") {
          return tags.includes("Product-Based Engineering") || tags.includes("Java / Backend Specialist");
        }
        return tags.includes(targetCompany);
      } catch {
        return false;
      }
    });

    if (companyMatches.length > 0) {
      filtered = companyMatches;
    }
  }

  // Return a randomized matching question so every session gets unique, varied questions
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const selected = filtered[randomIndex] || allEligible[0];
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

  // Idempotency: Check if this turn was already evaluated and scored
  const existingAnswers = await db
    .select()
    .from(candidateAnswers)
    .where(
      and(
        eq(candidateAnswers.sessionId, sessionId),
        eq(candidateAnswers.roundNumber, currentRound),
        eq(candidateAnswers.questionText, questionText)
      )
    )
    .orderBy(desc(candidateAnswers.createdAt))
    .limit(1);

  if (existingAnswers.length > 0 && existingAnswers[0].evaluationScore !== null) {
    const existing = existingAnswers[0];
    return {
      session: {
        id: session.id,
        currentRound: session.currentRound,
        currentQuestionIndex: session.currentQuestionIndex,
        status: session.status,
      },
      evaluation: {
        score: existing.evaluationScore,
        strengths: JSON.parse(existing.strengths || "[]"),
        weaknesses: JSON.parse(existing.weaknesses || "[]"),
        feedback: existing.feedback,
      },
      interviewerReply: "Resuming interview. Evaluation for this turn was already recorded.",
      nextRound: session.currentRound,
      nextQuestionIndex: session.currentQuestionIndex,
      isRoundFinished: false,
      isInterviewComplete: session.status === "completed",
      idempotent: true,
    };
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
  let evaluation: AnswerEvaluation;
  try {
    evaluation = await aiProvider.evaluateAnswer({
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
  } catch (evalErr: any) {
    // Record candidate answer honestly with evaluationScore: null (NEVER fabricate scores)
    await db.insert(candidateAnswers).values({
      id: "ans-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: currentRound,
      questionId: questionId || null,
      questionText,
      answerText,
      evaluationScore: null,
      feedback: "AI evaluation service was temporarily unavailable or timed out. Your answer has been saved and can be retried.",
      confidenceLevel: "low_insufficient_evidence",
      createdAt: now,
    });

    throw new Error(`AI evaluation service failed: ${evalErr.message || "Timeout"}. Your answer draft is preserved.`);
  }

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
    expectedConcepts: evaluation.expectedConcepts ? JSON.stringify(evaluation.expectedConcepts) : null,
    demonstratedConcepts: evaluation.demonstratedConcepts ? JSON.stringify(evaluation.demonstratedConcepts) : null,
    missingConcepts: evaluation.missingConcepts ? JSON.stringify(evaluation.missingConcepts) : null,
    improvedAnswerOutline: evaluation.improvedAnswerOutline || null,
    confidenceLevel: evaluation.confidenceLevel || "high",
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
  } else if (session.mode === "pressure") {
    // In pressure mode, emphasize brisk pacing
    interviewerReply += `[Pacing Note: Keep responses crisp and direct]\n\n`;
  }

  // Check if candidate was already asked to clarify/elaborate on this current question
  const [lastInterviewerMsg] = await db
    .select()
    .from(conversationMessages)
    .where(
      and(
        eq(conversationMessages.sessionId, sessionId),
        eq(conversationMessages.roundNumber, currentRound),
        eq(conversationMessages.sender, "interviewer")
      )
    )
    .orderBy(desc(conversationMessages.timestamp))
    .limit(1);

  let wasAlreadyAskedToElaborate = false;
  let wasAlreadyAskedFollowUp = false;
  if (lastInterviewerMsg?.metadata) {
    try {
      const meta = typeof lastInterviewerMsg.metadata === "string" ? JSON.parse(lastInterviewerMsg.metadata) : lastInterviewerMsg.metadata;
      wasAlreadyAskedToElaborate = Boolean(meta?.isClarificationProbe);
      wasAlreadyAskedFollowUp = Boolean(meta?.isFollowUp);
    } catch {}
  }

  // If answer is vague or incomplete AND candidate has not yet been probed on this question:
  // DO NOT advance to the next question! Stop, stay on current question index, and listen to the candidate's elaboration.
  if (evaluation.isVagueOrIncomplete && !isRoundFinished && evaluation.clarificationPrompt && !wasAlreadyAskedToElaborate) {
    const probeReply = `${evaluation.clarificationPrompt}\n\nPlease elaborate on your specific technical implementation before we proceed to the next question.`;

    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: currentRound,
      sender: "interviewer",
      messageType: "question",
      content: probeReply,
      metadata: JSON.stringify({
        questionId: questionId || null,
        questionIndex: currentIdx,
        isClarificationProbe: true,
      }),
      timestamp: new Date(),
    });

    return {
      evaluation,
      interviewerReply: probeReply,
      roundCompleted: false,
      nextRound: currentRound,
      isInterviewComplete: false,
    };
  }

  // Follow-up questions in Round 1 (Technical Fundamentals) & Round 2 (Advanced CS & Projects):
  // Probe deeper into candidate's answer with a sharp, realistic technical follow-up!
  if ((currentRound === 1 || currentRound === 2) && !wasAlreadyAskedFollowUp && !wasAlreadyAskedToElaborate && currentIdx < maxQuestionsInRound - 1) {
    let followUpText = "";

    // 1. Check if original question had curated follow-ups
    if (questionId) {
      try {
        const [qRecord] = await db.select().from(questions).where(eq(questions.id, questionId));
        if (qRecord?.followUps) {
          const parsed = JSON.parse(qRecord.followUps);
          if (Array.isArray(parsed) && parsed.length > 0) {
            followUpText = parsed[Math.floor(Math.random() * parsed.length)];
          }
        }
      } catch {}
    }

    // 2. If not found, use AI or structured generator
    if (!followUpText) {
      try {
        const ai = getAIProvider();
        const followUpRes = await ai.generateFollowUp({
          currentQuestionText: questionText,
          candidateAnswer: answerText,
          evaluation,
          context: {
            sessionId,
            roundNumber: currentRound,
            roundName: ROUND_NAMES[currentRound],
            mode: session.mode as InterviewMode,
            companyProfile: session.companyProfile as CompanyProfile,
            targetRole: session.targetRole,
            difficulty: session.difficulty as any,
            primaryLanguage: session.primaryLanguage || "java",
            recentConversation: [],
          },
        });
        if (followUpRes?.followUpQuestion) {
          followUpText = followUpRes.followUpQuestion;
        }
      } catch {}
    }

    // 3. Fallback targeted technical follow-up
    if (!followUpText) {
      followUpText = currentRound === 1
        ? "How would you handle boundary conditions, memory efficiency, or thread-safety when applying this concept?"
        : "In a production architecture with 10x higher throughput, what latency bottlenecks or failure modes would you anticipate with this design?";
    }

    const followUpMsg = `${interviewerReply}Thank you. As a follow-up on your response:\n\n**${followUpText}**`;

    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: currentRound,
      sender: "interviewer",
      messageType: "followup",
      content: followUpMsg,
      metadata: JSON.stringify({
        questionId: questionId || null,
        questionIndex: currentIdx,
        isFollowUp: true,
      }),
      timestamp: new Date(),
    });

    return {
      evaluation,
      interviewerReply: followUpMsg,
      roundCompleted: false,
      nextRound: currentRound,
      isInterviewComplete: false,
    };
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
        // Coding Round presentation - Company-specific & randomized
        const problem = await selectRandomCodingProblem({
          companyProfile: session.companyProfile,
          difficulty: session.difficulty,
        });
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

export async function advanceToNextRound(sessionId: string, targetRoundNumber?: RoundNumber) {
  await ensureDbInitialized();
  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));

  if (!session) throw new Error("Interview session not found");
  const currentRound = session.currentRound as RoundNumber;

  const nextRound = (targetRoundNumber || Math.min(4, currentRound + 1)) as RoundNumber;
  if (nextRound === currentRound && currentRound === 4) {
    return await finishSession(sessionId);
  }

  // Complete current round
  await completeRound(sessionId, currentRound);

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

  let interviewerReply = "";
  if (nextRound === 3) {
    const problem = await selectRandomCodingProblem({
      companyProfile: session.companyProfile,
      difficulty: session.difficulty,
    });
    interviewerReply = `We are now transitioning to Round 3: Coding Interview.\n\n` +
      `Your coding challenge is: **${problem.title}** (${problem.difficulty.toUpperCase()}).\n\n` +
      `${problem.description}\n\n` +
      `Explain your algorithmic approach aloud and write your code in the editor pane when ready.`;

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
  } else {
    const nextQ = await getNextQuestionForRound(sessionId, nextRound, 0);
    interviewerReply = `Proceeding to Round ${nextRound}: ${ROUND_NAMES[nextRound]}.\n\n` +
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
  }

  return { success: true, nextRound, interviewerReply };
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

  // Load Blueprint and generate Resume-Specific Dossier
  const blueprint = await getBlueprintForSession(sessionId);
  let parsedProfile = null;
  if (session.resumeText) {
    const parseRes = parseResumeStructured(session.resumeText);
    if (parseRes.success) parsedProfile = parseRes.profile;
  }

  const resumeDossier = compileResumeAssessmentDossier({
    blueprint,
    profile: parsedProfile,
    answers,
    codeSubmissions: submissions,
    communicationIssues: communicationReport.issues,
  });

  // Generate comprehensive 8-section markdown export
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

## Section H: Resume-Specific Technical Verification & Study Plan
1. **Technologies Extracted from Resume:** ${resumeDossier.technologiesFound.join(", ") || "None"}
2. **Technologies Deeply Assessed:** ${resumeDossier.technologiesDeeplyAssessed.join(", ") || "None"}
3. **Skills Demonstrated Convincingly:** ${resumeDossier.skillsDemonstratedConvincingly.join(", ") || "None"}
4. **Skills Listed but Not Demonstrated:** ${resumeDossier.skillsListedNotDemonstrated.join(", ") || "None"}
5. **Project Claims Explained with Depth:**
${resumeDossier.projectClaimsExplainedWithDepth.map(c => `- ${c}`).join("\n") || "- None"}
6. **Topics Requiring Immediate Revision:**
${resumeDossier.topicsRequiringImprovement.map(t => `- ${t}`).join("\n") || "- None"}
7. **Coding Patterns Causing Difficulty:**
${resumeDossier.codingPatternsCausingDifficulty.map(cp => `- ${cp}`).join("\n")}
8. **Unassessed Resume Topics:** ${resumeDossier.resumeTopicsRemainingUnassessed.join(", ") || "All claimed topics were assessed."}
9. **Recommended Follow-Up Interview:** ${resumeDossier.recommendedFollowUpInterview}

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
    resumeAssessmentReport: JSON.stringify(resumeDossier),
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
