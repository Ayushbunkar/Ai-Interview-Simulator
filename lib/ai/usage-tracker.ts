import { db, ensureDbInitialized } from "../db";
import { apiUsageLogs } from "../db/schema";
import { desc, count, sql } from "drizzle-orm";
import { APIUsageSummary } from "../types";

export interface LogAPIUsageParams {
  service: "groq_ai" | "onlinecompiler" | "system";
  endpoint: string;
  modelOrLang: string;
  status: "success" | "error" | "timeout" | "rate_limited";
  responseTimeMs: number;
  promptTokensEst?: number;
  completionTokensEst?: number;
  errorMessage?: string;
}

/**
 * Persists an API usage record to the database for transparent local auditing.
 */
export async function logAPIUsage(params: LogAPIUsageParams): Promise<void> {
  try {
    await ensureDbInitialized();
    await db.insert(apiUsageLogs).values({
      id: "log-" + Math.random().toString(36).substring(2, 10),
      service: params.service,
      endpoint: params.endpoint,
      modelOrLang: params.modelOrLang,
      status: params.status,
      responseTimeMs: params.responseTimeMs,
      promptTokensEst: params.promptTokensEst || 0,
      completionTokensEst: params.completionTokensEst || 0,
      errorMessage: params.errorMessage || null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to persist API usage record:", err);
  }
}

/**
 * Returns aggregated application-side usage metrics.
 * Explicitly labels estimations so users know they are local approximations.
 */
export async function getAPIUsageSummary(): Promise<APIUsageSummary> {
  await ensureDbInitialized();

  const logs = await db
    .select()
    .from(apiUsageLogs)
    .orderBy(desc(apiUsageLogs.createdAt))
    .limit(100);

  let totalAiRequests = 0;
  let totalCompilerRequests = 0;
  let totalErrors = 0;
  let totalTimeouts = 0;
  let totalRetries = 0;
  let estimatedTokens = 0;

  for (const log of logs) {
    if (log.service === "groq_ai") {
      totalAiRequests++;
      estimatedTokens += (log.promptTokensEst || 0) + (log.completionTokensEst || 0);
    } else if (log.service === "onlinecompiler") {
      totalCompilerRequests++;
    }

    if (log.status === "error") totalErrors++;
    if (log.status === "timeout") totalTimeouts++;
    if (log.status === "rate_limited") totalRetries++;
  }

  return {
    totalAiRequests,
    totalCompilerRequests,
    totalErrors,
    totalTimeouts,
    totalRetries,
    estimatedTokens,
    isEstimated: true,
    recentLogs: logs.slice(0, 15).map(l => ({
      service: l.service,
      endpoint: l.endpoint,
      status: l.status,
      responseTimeMs: l.responseTimeMs,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

/**
 * Bounded context window helper: keeps conversation context bounded within token safety limits.
 */
export function boundConversationContext<T extends { content: string }>(
  messages: T[],
  maxChars: number = 6000
): T[] {
  let charCount = 0;
  const result: T[] = [];

  // Iterate backwards from most recent message
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    charCount += msg.content.length;
    if (charCount > maxChars && result.length > 0) break;
    result.unshift(msg);
  }

  return result;
}
