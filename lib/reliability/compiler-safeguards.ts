/**
 * Compiler Service Safeguards
 * - Pre-execution validation (< 64KB code, < 10KB stdin)
 * - Submission deduplication (in-flight locking)
 * - Bounded polling and timeouts
 * - Clear diagnostic message on service unreachable:
 *   "Code execution could not be completed because the compiler service did not respond. Your code has been preserved. No successful execution was confirmed."
 */

export const MAX_CODE_SIZE_BYTES = 64 * 1024; // 64 KB
export const MAX_STDIN_SIZE_BYTES = 10 * 1024; // 10 KB
export const COMPILER_UNREACHABLE_MESSAGE =
  "Code execution could not be completed because the compiler service did not respond. Your code has been preserved. No successful execution was confirmed.";

export class CodePayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CodePayloadTooLargeError";
  }
}

export class DuplicateExecutionError extends Error {
  constructor(message: string = "An identical code execution is already in progress. Concurrent submission prevented.") {
    super(message);
    this.name = "DuplicateExecutionError";
  }
}

/**
 * Validates code size and input data size.
 */
export function validateExecutionPayload(code: string, stdin?: string): void {
  const codeBytes = Buffer.byteLength(code || "", "utf8");
  if (codeBytes > MAX_CODE_SIZE_BYTES) {
    throw new CodePayloadTooLargeError(
      `Code submission exceeds the 64 KB limit (${Math.round(codeBytes / 1024)} KB submitted). Please reduce code size.`
    );
  }

  if (stdin) {
    const stdinBytes = Buffer.byteLength(stdin, "utf8");
    if (stdinBytes > MAX_STDIN_SIZE_BYTES) {
      throw new CodePayloadTooLargeError(
        `Input data exceeds the 10 KB limit (${Math.round(stdinBytes / 1024)} KB submitted). Please reduce input data size.`
      );
    }
  }
}

// In-flight execution lock map: key -> timestamp
const inFlightExecutions = new Map<string, number>();
const LOCK_TIMEOUT_MS = 25000;

function computeExecutionKey(language: string, code: string, stdin: string = "", sessionId?: string): string {
  // Simple fast hash of payload
  let hash = 0;
  const str = `${sessionId || ""}:${language}:${code}:${stdin}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `exec:${language}:${hash}`;
}

/**
 * Acquires an in-flight execution lock. Throws DuplicateExecutionError if active.
 */
export function acquireExecutionLock(language: string, code: string, stdin: string = "", sessionId?: string): string {
  const key = computeExecutionKey(language, code, stdin, sessionId);
  const now = Date.now();
  const existing = inFlightExecutions.get(key);

  if (existing) {
    if (now - existing < LOCK_TIMEOUT_MS) {
      throw new DuplicateExecutionError();
    } else {
      // Stale lock expired
      inFlightExecutions.delete(key);
    }
  }

  inFlightExecutions.set(key, now);
  return key;
}

/**
 * Releases the execution lock.
 */
export function releaseExecutionLock(lockKey: string): void {
  inFlightExecutions.delete(lockKey);
}

/**
 * Clears all execution locks (useful for test suites).
 */
export function clearAllExecutionLocks(): void {
  inFlightExecutions.clear();
}
