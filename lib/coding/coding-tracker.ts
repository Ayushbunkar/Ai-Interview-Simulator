import { db } from "../db";
import { codingStepsLog, codeSubmissions, executionResults, testCases } from "../db/schema";
import { CodingStepType, CodingStepEntry } from "../types";
import { eq, and, desc } from "drizzle-orm";

export interface LogCodingStepParams {
  sessionId: string;
  problemId: string;
  stepType: CodingStepType;
  content: string;
  metadata?: any;
}

/**
 * Logs each step of the candidate's coding process (spoken approach, complexity claim,
 * code revision, test runs, debugging notes).
 */
export async function logCodingStep(params: LogCodingStepParams): Promise<CodingStepEntry> {
  const id = "step-" + Math.random().toString(36).substring(2, 10);
  const now = new Date();

  await db.insert(codingStepsLog).values({
    id,
    sessionId: params.sessionId,
    problemId: params.problemId,
    stepType: params.stepType,
    content: params.content,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    createdAt: now,
  });

  return {
    id,
    sessionId: params.sessionId,
    problemId: params.problemId,
    stepType: params.stepType,
    content: params.content,
    metadata: params.metadata,
    createdAt: now.toISOString(),
  };
}

/**
 * Retrieves the sequential timeline of a candidate's problem-solving process.
 */
export async function getProblemSolvingTimeline(
  sessionId: string,
  problemId: string
): Promise<CodingStepEntry[]> {
  const rows = await db
    .select()
    .from(codingStepsLog)
    .where(
      and(
        eq(codingStepsLog.sessionId, sessionId),
        eq(codingStepsLog.problemId, problemId)
      )
    )
    .orderBy(codingStepsLog.createdAt);

  return rows.map(r => ({
    id: r.id,
    sessionId: r.sessionId,
    problemId: r.problemId,
    stepType: r.stepType as CodingStepType,
    content: r.content,
    metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Generates an appropriate interviewer inquiry based on the candidate's current stage and submission results.
 * Strictly adheres to: Correctness comes from verified compiler execution, not AI guessing.
 */
export function generateCodingInterviewerProbe(stage: {
  hasApproach: boolean;
  hasCode: boolean;
  compilerStatus?: string;
  failedTestCount?: number;
  lastCodeSnippet?: string;
  claimedComplexity?: string;
}): string {
  // If tests failed on the actual compiler
  if (stage.compilerStatus === "wrong_answer" && (stage.failedTestCount ?? 0) > 0) {
    return `Your submission failed on ${stage.failedTestCount} test case(s). Inspecting your logic: why do you think this edge case failed, and how can you trace or debug the discrepancy?`;
  }

  // If compiler threw a syntax/compilation error
  if (stage.compilerStatus === "compilation_error") {
    return `The compiler reported a syntax or type mismatch error. What part of the signature or type declaration needs adjustment?`;
  }

  // If candidate hasn't explained complexity yet
  if (!stage.claimedComplexity && stage.hasApproach) {
    return `Before finalizing your implementation: what is the worst-case time complexity and space complexity of this approach? Could it be optimized further?`;
  }

  // If candidate proposed a brute-force approach
  if (stage.hasApproach && !stage.hasCode) {
    return `Why does this specific algorithm work for this constraint set, and which edge cases (like empty collections, single items, or duplicates) could break it?`;
  }

  // Default algorithmic inquiry
  return `What happens to the execution time and memory footprint if the input size increases from 1,000 to 1,000,000 elements? Could an alternative data structure reduce the overhead?`;
}
