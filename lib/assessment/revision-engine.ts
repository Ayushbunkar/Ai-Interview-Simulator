import { db, ensureDbInitialized } from "../db";
import {
  candidateSkillsProfile,
  revisionQueue,
  revisionAttempts,
  candidateAnswers,
  codeSubmissions,
  interviewReports,
  questions,
  codingProblems,
} from "../db/schema";
import { eq, and, sql, desc, lte } from "drizzle-orm";
import { RevisionItem, CandidateSkillRecord } from "../types";

export const REQUIRED_SKILLS = [
  { key: "java", label: "Java Core & Syntax" },
  { key: "oop", label: "Object-Oriented Programming" },
  { key: "dsa", label: "Data Structures & Algorithms" },
  { key: "complexity_analysis", label: "Complexity Analysis & Big-O" },
  { key: "dbms_sql", label: "DBMS & SQL Queries" },
  { key: "operating_systems", label: "Operating Systems & Memory" },
  { key: "computer_networks", label: "Computer Networks & Protocols" },
  { key: "backend_engineering", label: "Backend Engineering & REST APIs" },
  { key: "problem_solving", label: "Algorithmic Problem-Solving" },
  { key: "debugging", label: "Code Tracing & Debugging" },
  { key: "code_correctness", label: "Coding Correctness & Edge Cases" },
  { key: "english_grammar", label: "English Grammar & Structure" },
  { key: "technical_communication", label: "Technical Communication & Precision" },
  { key: "behavioral", label: "Behavioral Answers & STAR Structure" },
];

/**
 * Ensures all 14 standard skills are seeded into candidate_skills_profile if not present.
 */
export async function initializeSkillsProfile(): Promise<void> {
  await ensureDbInitialized();
  const existing = await db.select().from(candidateSkillsProfile);
  const existingKeys = new Set(existing.map(s => s.skillCategory));

  for (const skill of REQUIRED_SKILLS) {
    if (!existingKeys.has(skill.key)) {
      await db.insert(candidateSkillsProfile).values({
        id: "skill-" + skill.key,
        skillCategory: skill.key,
        label: skill.label,
        status: "not_assessed",
        score: null,
        timesAssessed: 0,
        timesCorrect: 0,
        evidenceNotes: JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}

/**
 * Updates the candidate's persistent skills profile using evidence from a completed or in-progress session.
 * Distinguishes strictly between 'not_assessed' and 'weak'.
 */
export async function updateSkillsProfileFromSession(sessionId: string): Promise<void> {
  await initializeSkillsProfile();

  // 1. Fetch answers from this session
  const answers = await db
    .select()
    .from(candidateAnswers)
    .where(eq(candidateAnswers.sessionId, sessionId));

  // 2. Fetch code submissions from this session
  const submissions = await db
    .select()
    .from(codeSubmissions)
    .where(eq(codeSubmissions.sessionId, sessionId));

  // 3. Fetch report if available
  const [report] = await db
    .select()
    .from(interviewReports)
    .where(eq(interviewReports.sessionId, sessionId));

  const now = new Date();

  // Helper to map question text or category to skill keys
  const mapToSkills = (qText: string): string[] => {
    const lower = qText.toLowerCase();
    const matched: string[] = [];
    if (lower.includes("java") || lower.includes("jvm") || lower.includes("garbage")) matched.push("java");
    if (lower.includes("oop") || lower.includes("polymorphism") || lower.includes("inheritance") || lower.includes("interface")) matched.push("oop");
    if (lower.includes("tree") || lower.includes("graph") || lower.includes("stack") || lower.includes("queue") || lower.includes("array") || lower.includes("dsa")) matched.push("dsa");
    if (lower.includes("complexity") || lower.includes("big-o") || lower.includes("time complexity")) matched.push("complexity_analysis");
    if (lower.includes("sql") || lower.includes("database") || lower.includes("acid") || lower.includes("index") || lower.includes("join")) matched.push("dbms_sql");
    if (lower.includes("deadlock") || lower.includes("process") || lower.includes("thread") || lower.includes("paging") || lower.includes("memory")) matched.push("operating_systems");
    if (lower.includes("http") || lower.includes("tcp") || lower.includes("udp") || lower.includes("dns") || lower.includes("network")) matched.push("computer_networks");
    if (lower.includes("rest") || lower.includes("api") || lower.includes("microservice") || lower.includes("spring") || lower.includes("controller")) matched.push("backend_engineering");
    if (lower.includes("tell me about") || lower.includes("conflict") || lower.includes("project") || lower.includes("challenge") || lower.includes("situation")) matched.push("behavioral");
    return matched.length > 0 ? matched : ["technical_communication"];
  };

  // Process answers
  for (const ans of answers) {
    const score = ans.evaluationScore ?? 65;
    const skills = mapToSkills(ans.questionText);

    for (const skillKey of skills) {
      const [existing] = await db
        .select()
        .from(candidateSkillsProfile)
        .where(eq(candidateSkillsProfile.skillCategory, skillKey));

      if (existing) {
        const timesAssessed = existing.timesAssessed + 1;
        const timesCorrect = existing.timesCorrect + (score >= 65 ? 1 : 0);
        const prevScore = existing.score ?? score;
        const newScore = Math.round((prevScore + score) / 2);

        let status = "proficient";
        if (newScore < 60) status = "weak";
        else if (newScore >= 85) status = "mastered";

        const evidence = JSON.parse(existing.evidenceNotes || "[]");
        evidence.push(`Answered "${ans.questionText.slice(0, 50)}..." scored ${score}/100.`);

        await db
          .update(candidateSkillsProfile)
          .set({
            status,
            score: newScore,
            timesAssessed,
            timesCorrect,
            evidenceNotes: JSON.stringify(evidence.slice(-5)),
            lastAssessedAt: now,
            updatedAt: now,
          })
          .where(eq(candidateSkillsProfile.id, existing.id));
      }
    }
  }

  // Process code submissions for problem-solving, debugging, code_correctness
  if (submissions.length > 0) {
    for (const sub of submissions) {
      const isAccepted = sub.status === "accepted";
      const codingSkills = ["problem_solving", "code_correctness", "debugging"];

      for (const skillKey of codingSkills) {
        const [existing] = await db
          .select()
          .from(candidateSkillsProfile)
          .where(eq(candidateSkillsProfile.skillCategory, skillKey));

        if (existing) {
          const score = isAccepted ? 90 : Math.round((sub.passedTests / Math.max(1, sub.totalTests)) * 70);
          const timesAssessed = existing.timesAssessed + 1;
          const timesCorrect = existing.timesCorrect + (isAccepted ? 1 : 0);
          const prevScore = existing.score ?? score;
          const newScore = Math.round((prevScore + score) / 2);

          let status = "proficient";
          if (newScore < 60) status = "weak";
          else if (newScore >= 85) status = "mastered";

          const evidence = JSON.parse(existing.evidenceNotes || "[]");
          evidence.push(`Code submission ${sub.id.slice(0, 8)} status: ${sub.status} (${sub.passedTests}/${sub.totalTests} tests passed).`);

          await db
            .update(candidateSkillsProfile)
            .set({
              status,
              score: newScore,
              timesAssessed,
              timesCorrect,
              evidenceNotes: JSON.stringify(evidence.slice(-5)),
              lastAssessedAt: now,
              updatedAt: now,
            })
            .where(eq(candidateSkillsProfile.id, existing.id));
        }
      }
    }
  }

  // Process communication and grammar if report exists
  if (report) {
    try {
      const commReport = JSON.parse(report.communicationAssessment || "{}");
      if (commReport.grammarScore) {
        const [existing] = await db
          .select()
          .from(candidateSkillsProfile)
          .where(eq(candidateSkillsProfile.skillCategory, "english_grammar"));

        if (existing) {
          const grammarScore = commReport.grammarScore;
          await db
            .update(candidateSkillsProfile)
            .set({
              status: grammarScore < 60 ? "weak" : grammarScore >= 85 ? "mastered" : "proficient",
              score: grammarScore,
              timesAssessed: existing.timesAssessed + 1,
              timesCorrect: existing.timesCorrect + (grammarScore >= 65 ? 1 : 0),
              lastAssessedAt: now,
              updatedAt: now,
            })
            .where(eq(candidateSkillsProfile.id, existing.id));
        }
      }
    } catch {
      // ignore JSON parse issue
    }
  }
}

/**
 * Populates or updates the candidate's revision queue with questions or topics where they struggled.
 */
export async function syncRevisionQueueFromSession(sessionId: string): Promise<number> {
  await ensureDbInitialized();

  // Find answers scoring < 60
  const answers = await db
    .select()
    .from(candidateAnswers)
    .where(eq(candidateAnswers.sessionId, sessionId));

  const weakAnswers = answers.filter(a => (a.evaluationScore ?? 100) < 60);
  let count = 0;

  for (const ans of weakAnswers) {
    const existing = await db
      .select()
      .from(revisionQueue)
      .where(eq(revisionQueue.questionId, ans.questionId || ""));

    const now = new Date();
    const nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day interval initially

    if (existing.length > 0) {
      // Mark as repeated mistake
      await db
        .update(revisionQueue)
        .set({
          reason: "repeated_mistake",
          status: "pending",
          nextReviewDue: nextDue,
          updatedAt: now,
        })
        .where(eq(revisionQueue.id, existing[0].id));
    } else {
      await db.insert(revisionQueue).values({
        id: "rev-" + Math.random().toString(36).substring(2, 10),
        itemType: "question",
        questionId: ans.questionId || null,
        title: ans.questionText.slice(0, 80),
        topic: "Core Concept",
        skillCategory: "technical_knowledge",
        reason: "previously_incorrect",
        evidenceContext: `Candidate answer scored ${ans.evaluationScore ?? 0}/100. Feedback: ${ans.feedback || "Conceptual gap"}.`,
        referenceNotes: "Focus on precision, edge cases, and architectural trade-offs.",
        repetitionCount: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDue: nextDue,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }
  }

  // Also check failed coding problems
  const submissions = await db
    .select()
    .from(codeSubmissions)
    .where(eq(codeSubmissions.sessionId, sessionId));

  for (const sub of submissions) {
    if (sub.status !== "accepted") {
      const [prob] = await db.select().from(codingProblems).where(eq(codingProblems.id, sub.problemId));
      if (prob) {
        const existing = await db
          .select()
          .from(revisionQueue)
          .where(eq(revisionQueue.problemId, prob.id));

        const now = new Date();
        const nextDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        if (existing.length === 0) {
          await db.insert(revisionQueue).values({
            id: "rev-" + Math.random().toString(36).substring(2, 10),
            itemType: "problem",
            problemId: prob.id,
            title: prob.title,
            topic: "Coding Problem",
            skillCategory: "code_correctness",
            reason: "previously_incorrect",
            evidenceContext: `Submission resulted in ${sub.status} (${sub.passedTests}/${sub.totalTests} tests passed).`,
            referenceNotes: prob.hints,
            repetitionCount: 0,
            intervalDays: 1,
            easeFactor: 2.5,
            nextReviewDue: nextDue,
            status: "pending",
            createdAt: now,
            updatedAt: now,
          });
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Handles a candidate's revision practice attempt using spaced-repetition spacing.
 */
export async function recordRevisionAttempt(params: {
  revisionItemId: string;
  candidateResponse: string;
  score: number;
  feedback: string;
}): Promise<void> {
  const { revisionItemId, candidateResponse, score, feedback } = params;
  const now = new Date();

  // Record attempt
  await db.insert(revisionAttempts).values({
    id: "att-" + Math.random().toString(36).substring(2, 10),
    revisionItemId,
    candidateResponse,
    score,
    feedback,
    reviewedAt: now,
  });

  // Calculate new spaced repetition interval
  const [item] = await db
    .select()
    .from(revisionQueue)
    .where(eq(revisionQueue.id, revisionItemId));

  if (item) {
    let intervalDays = item.intervalDays;
    let easeFactor = item.easeFactor;
    let repetitionCount = item.repetitionCount;
    let status = "pending";

    if (score >= 70) {
      repetitionCount += 1;
      if (repetitionCount === 1) intervalDays = 2;
      else if (repetitionCount === 2) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * easeFactor);

      easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - Math.min(5, Math.floor(score / 20))) * (0.08 + (5 - Math.min(5, Math.floor(score / 20))) * 0.02)));
      status = repetitionCount >= 3 ? "mastered" : "reviewed";
    } else {
      repetitionCount = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      status = "pending";
    }

    const nextReviewDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    await db
      .update(revisionQueue)
      .set({
        repetitionCount,
        intervalDays,
        easeFactor,
        nextReviewDue,
        status,
        updatedAt: now,
      })
      .where(eq(revisionQueue.id, revisionItemId));
  }
}

/**
 * Marks a revision item manually as reviewed and advances its review due date.
 */
export async function markRevisionItemReviewed(revisionItemId: string): Promise<void> {
  const [item] = await db.select().from(revisionQueue).where(eq(revisionQueue.id, revisionItemId));
  if (!item) return;

  const now = new Date();
  const nextReviewDue = new Date(now.getTime() + item.intervalDays * 24 * 60 * 60 * 1000);

  await db
    .update(revisionQueue)
    .set({
      status: "reviewed",
      nextReviewDue,
      updatedAt: now,
    })
    .where(eq(revisionQueue.id, revisionItemId));
}

/**
 * Fetches all persistent skills with distinction between not_assessed and weak.
 */
export async function getPersistentSkills(): Promise<CandidateSkillRecord[]> {
  await initializeSkillsProfile();
  const rows = await db.select().from(candidateSkillsProfile).orderBy(candidateSkillsProfile.label);

  return rows.map(r => ({
    id: r.id,
    skillCategory: r.skillCategory,
    label: r.label,
    status: r.status as any,
    score: r.score,
    timesAssessed: r.timesAssessed,
    timesCorrect: r.timesCorrect,
    evidenceNotes: JSON.parse(r.evidenceNotes || "[]"),
    lastAssessedAt: r.lastAssessedAt?.toISOString() || null,
  }));
}

/**
 * Fetches current revision queue items.
 */
export async function getRevisionQueueItems(filter?: "due" | "all"): Promise<RevisionItem[]> {
  await ensureDbInitialized();
  const rows = await db.select().from(revisionQueue).orderBy(desc(revisionQueue.updatedAt));

  const items: RevisionItem[] = rows.map(r => ({
    id: r.id,
    itemType: r.itemType as any,
    questionId: r.questionId || undefined,
    problemId: r.problemId || undefined,
    title: r.title,
    topic: r.topic,
    skillCategory: r.skillCategory,
    reason: r.reason as any,
    evidenceContext: r.evidenceContext,
    referenceNotes: r.referenceNotes,
    repetitionCount: r.repetitionCount,
    intervalDays: r.intervalDays,
    easeFactor: r.easeFactor,
    nextReviewDue: r.nextReviewDue.toISOString(),
    status: r.status as any,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  if (filter === "due") {
    const now = new Date();
    return items.filter(i => new Date(i.nextReviewDue) <= now || i.status === "pending");
  }

  return items;
}
