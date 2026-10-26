/**
 * Centralized AI Request Manager with Bounded Retries, Circuit Breaker,
 * In-Flight Turn Locking, and Token Cost Control.
 */

export type RequestState = "idle" | "pending" | "succeeded" | "failed" | "cancelled" | "timed_out";

export interface AIRequestOptions {
  timeoutMs?: number;
  maxRetries?: number; // Default 1 (1 initial attempt + at most 1 transient retry)
  actionId?: string; // Stable turn/action identifier for in-flight locking
  serviceName?: string;
}

export class CircuitBreakerOpenError extends Error {
  constructor(public service: string, public cooldownRemainingMs: number) {
    super(`Circuit breaker is OPEN for ${service}. Service temporarily paused for ${Math.round(cooldownRemainingMs / 1000)}s due to repeated failures.`);
    this.name = "CircuitBreakerOpenError";
  }
}

export class InFlightRequestConflictError extends Error {
  constructor(public actionId: string) {
    super(`A request for action '${actionId}' is already in progress. Concurrent submission prevented.`);
    this.name = "InFlightRequestConflictError";
  }
}

export class PermanentAIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "PermanentAIError";
  }
}

export class TransientAIError extends Error {
  constructor(message: string, public status?: number, public retryAfterMs?: number) {
    super(message);
    this.name = "TransientAIError";
  }
}

// Global In-Flight Lock Registry
const inFlightRegistry = new Map<string, { startedAt: number; controller: AbortController }>();

// Circuit Breaker State per Service
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "closed" | "open" | "half_open";
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const FAILURE_THRESHOLD = 3; // Trip after 3 consecutive failures
const COOLDOWN_DURATION_MS = 45000; // 45 seconds cooldown

function getCircuitBreaker(service: string): CircuitBreakerState {
  let cb = circuitBreakers.get(service);
  if (!cb) {
    cb = { failures: 0, lastFailureTime: 0, state: "closed" };
    circuitBreakers.set(service, cb);
  }
  return cb;
}

export function recordCircuitSuccess(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures = 0;
  cb.state = "closed";
}

export function recordCircuitFailure(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures += 1;
  cb.lastFailureTime = Date.now();
  if (cb.failures >= FAILURE_THRESHOLD) {
    cb.state = "open";
  }
}

export function checkCircuitBreaker(service: string) {
  const cb = getCircuitBreaker(service);
  if (cb.state === "open") {
    const elapsed = Date.now() - cb.lastFailureTime;
    if (elapsed > COOLDOWN_DURATION_MS) {
      // Transition to half-open to test one probe request
      cb.state = "half_open";
    } else {
      throw new CircuitBreakerOpenError(service, COOLDOWN_DURATION_MS - elapsed);
    }
  }
}

/**
 * Checks whether an error is transient (recoverable via 1 single retry) or permanent.
 */
export function classifyError(error: any): { isTransient: boolean; status?: number; retryAfterMs?: number } {
  if (!error) return { isTransient: false };

  const message = (error.message || "").toLowerCase();
  const status = error.status || error.statusCode || error.response?.status;

  // 1. Permanent failures: NEVER retry
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    message.includes("api key") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("model not found") ||
    message.includes("invalid model") ||
    message.includes("validation") ||
    message.includes("zod")
  ) {
    return { isTransient: false, status };
  }

  // 2. Transient failures: temporary rate limits (429) or temporary server errors (500, 502, 503, 504)
  if (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("rate limit") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborted") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket hang up")
  ) {
    let retryAfterMs: number | undefined;
    const retryHeader = error.headers?.get?.("retry-after") || error.response?.headers?.["retry-after"];
    if (retryHeader) {
      const parsedSeconds = parseFloat(retryHeader);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        retryAfterMs = Math.min(10000, Math.round(parsedSeconds * 1000));
      }
    }
    return { isTransient: true, status, retryAfterMs };
  }

  return { isTransient: false, status };
}

/**
 * Executes an AI operation with strict lifecycle, single transient retry, timeout,
 * and concurrency locking.
 */
export async function executeAIRequest<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: AIRequestOptions = {}
): Promise<T> {
  const {
    timeoutMs = 15000,
    maxRetries = 1, // Strict rule: at most ONE retry for transient errors
    actionId,
    serviceName = "groq_ai",
  } = options;

  // 1. Check Circuit Breaker
  checkCircuitBreaker(serviceName);

  // 2. In-Flight Turn Lock Check (Prevents rapid double clicks & duplicate effect requests)
  if (actionId) {
    const existing = inFlightRegistry.get(actionId);
    if (existing) {
      const lockAge = Date.now() - existing.startedAt;
      if (lockAge < timeoutMs + 2000) {
        throw new InFlightRequestConflictError(actionId);
      } else {
        // Expired lock cleanup
        existing.controller.abort();
        inFlightRegistry.delete(actionId);
      }
    }
  }

  const turnController = new AbortController();
  if (actionId) {
    inFlightRegistry.set(actionId, { startedAt: Date.now(), controller: turnController });
  }

  let attempt = 0;
  const maxAttempts = 1 + Math.min(1, maxRetries); // Max 2 attempts total (1 initial + 1 retry)

  try {
    while (attempt < maxAttempts) {
      attempt++;
      const attemptController = new AbortController();
      const timeoutTimer = setTimeout(() => attemptController.abort(), timeoutMs);

      // Link parent cancellation
      const abortHandler = () => attemptController.abort();
      turnController.signal.addEventListener("abort", abortHandler);

      try {
        const result = await operation(attemptController.signal);
        clearTimeout(timeoutTimer);
        recordCircuitSuccess(serviceName);
        return result;
      } catch (err: any) {
        clearTimeout(timeoutTimer);
        turnController.signal.removeEventListener("abort", abortHandler);

        const isTimeout = attemptController.signal.aborted || (err.name === "AbortError");
        const classification = classifyError(err);

        // If permanent error or last attempt, fail immediately
        if (!classification.isTransient && !isTimeout) {
          recordCircuitFailure(serviceName);
          throw new PermanentAIError(err.message || "Non-recoverable AI error", classification.status);
        }

        if (attempt >= maxAttempts) {
          recordCircuitFailure(serviceName);
          if (isTimeout) {
            throw new Error(`AI request timed out after ${timeoutMs}ms.`);
          }
          throw err;
        }

        // Wait before permitted single retry (bounded exponential backoff with jitter)
        const baseWait = classification.retryAfterMs || 1000;
        const jitter = Math.floor(Math.random() * 500);
        const backoffMs = Math.min(8000, baseWait + jitter);

        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    throw new Error("AI request attempts exhausted.");
  } finally {
    if (actionId) {
      inFlightRegistry.delete(actionId);
    }
  }
}

/**
 * Helper to release an in-flight lock manually if needed.
 */
export function releaseInFlightLock(actionId: string) {
  const existing = inFlightRegistry.get(actionId);
  if (existing) {
    existing.controller.abort();
    inFlightRegistry.delete(actionId);
  }
}

/**
 * Resets circuit breakers (useful in test suites).
 */
export function resetAllCircuitBreakers() {
  circuitBreakers.clear();
  inFlightRegistry.clear();
}
