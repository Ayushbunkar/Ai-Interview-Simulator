import { AnswerEvaluation, RoundNumber, InterviewMode } from "../types";

export interface AdaptiveContext {
  sessionId: string;
  roundNumber: RoundNumber;
  currentQuestionIndex: number;
  mode: InterviewMode;
  difficulty: string;
  timeRemainingSeconds: number;
  previousScores: number[];
  askedQuestionIds: Set<string>;
  historicalWeaknesses: string[];
  lastEvaluation?: AnswerEvaluation;
}

export interface AdaptiveQuestionDecision {
  action: "follow_up" | "probe_omission" | "advance_question" | "practice_hint";
  prompt: string;
  targetCategory?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  explanation: string;
}

/**
 * Calculates adaptive difficulty adjustment based on candidate's performance trend.
 */
export function calculateAdaptiveDifficulty(
  baselineDifficulty: string,
  recentScores: number[]
): "easy" | "medium" | "hard" {
  if (recentScores.length === 0) {
    if (baselineDifficulty === "fresher" || baselineDifficulty === "entry_level") return "easy";
    if (baselineDifficulty === "junior" || baselineDifficulty === "intermediate") return "medium";
    return "hard";
  }

  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  if (avg >= 80) {
    return baselineDifficulty === "fresher" ? "medium" : "hard";
  } else if (avg <= 45) {
    return "easy";
  }
  return "medium";
}

/**
 * Evaluates whether a candidate's answer requires a deeper follow-up, an omission probe,
 * or allows advancing to the next question.
 */
export function evaluateAdaptiveTurn(
  context: AdaptiveContext,
  lastQuestionText: string,
  candidateAnswer: string,
  evaluation: AnswerEvaluation
): AdaptiveQuestionDecision {
  const score = evaluation.score;
  const isPractice = context.mode === "practice";

  // 1. Strong answer (score >= 80) -> Probing deeper internals or trade-offs
  if (score >= 80) {
    const followUp = evaluation.suggestedFollowUp ||
      `That is a solid answer. To probe deeper: how would this behave under heavy concurrent load or memory pressure, and what trade-offs did you evaluate?`;

    return {
      action: "follow_up",
      prompt: followUp,
      targetDifficulty: "hard",
      explanation: `Candidate demonstrated strong competence (score: ${score}/100). Triggering deeper architectural follow-up.`,
    };
  }

  // 2. Incomplete answer (score between 45 and 79) -> Probing specific missing concept without giving away the answer
  if (score >= 45 && score < 80) {
    const primaryWeakness = evaluation.weaknesses?.[0] || "omitted edge cases";
    return {
      action: "probe_omission",
      prompt: `You covered key aspects, but didn't address ${primaryWeakness}. How would you incorporate that into your explanation?`,
      targetDifficulty: "medium",
      explanation: `Candidate provided a partial response (score: ${score}/100). Probing missing dimension (${primaryWeakness}).`,
    };
  }

  // 3. Weak or incorrect answer (score < 45)
  if (isPractice) {
    // In practice mode, explain mistake immediately and give coaching guidance
    const guidance = evaluation.feedback || "Review the core mechanics of this topic.";
    return {
      action: "practice_hint",
      prompt: `[Practice Coaching]: Your answer missed critical fundamentals. Key note: ${guidance}. Let's try to refine your understanding before moving forward.`,
      targetDifficulty: "easy",
      explanation: `Practice mode: Explaining conceptual gap immediately.`,
    };
  }

  // In strict mode, record weakness without leaking ideal answer
  return {
    action: "advance_question",
    prompt: `Understood. Let's move on to the next question.`,
    targetDifficulty: "easy",
    explanation: `Strict mode: Recording deficit without leaking answer prematurely.`,
  };
}

/**
 * Checks for near-duplicate question texts to guarantee no duplicate questions in the session.
 */
export function isNearDuplicateQuestion(textA: string, textB: string): boolean {
  const cleanA = textA.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const cleanB = textB.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  if (cleanA === cleanB) return true;

  const wordsA = new Set(cleanA.split(/\s+/));
  const wordsB = new Set(cleanB.split(/\s+/));

  let common = 0;
  wordsA.forEach(w => {
    if (wordsB.has(w) && w.length > 3) common++;
  });

  const similarity = (2 * common) / (wordsA.size + wordsB.size);
  return similarity > 0.75;
}
