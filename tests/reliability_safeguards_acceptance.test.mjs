import test from "node:test";
import assert from "node:assert/strict";
import {
  executeAIRequest,
  classifyError,
  checkCircuitBreaker,
  recordCircuitFailure,
  recordCircuitSuccess,
  resetAllCircuitBreakers,
  PermanentAIError,
  CircuitBreakerOpenError,
  InFlightRequestConflictError,
} from "../lib/reliability/ai-request-manager.ts";
import {
  validateExecutionPayload,
  acquireExecutionLock,
  releaseExecutionLock,
  clearAllExecutionLocks,
  CodePayloadTooLargeError,
  DuplicateExecutionError,
  COMPILER_UNREACHABLE_MESSAGE,
} from "../lib/reliability/compiler-safeguards.ts";

test.beforeEach(() => {
  resetAllCircuitBreakers();
  clearAllExecutionLocks();
});

test("Reliability: Error Classification correctly distinguishes permanent vs transient errors", () => {
  // Permanent errors (NEVER retry)
  assert.equal(classifyError({ status: 401 }).isTransient, false, "401 Unauthorized must be permanent");
  assert.equal(classifyError({ status: 403 }).isTransient, false, "403 Forbidden must be permanent");
  assert.equal(classifyError({ status: 400 }).isTransient, false, "400 Bad Request must be permanent");
  assert.equal(classifyError({ message: "Invalid API key provided" }).isTransient, false, "Invalid API key must be permanent");
  assert.equal(classifyError({ message: "Model 'non-existent-model' not found" }).isTransient, false, "Model not found must be permanent");
  assert.equal(classifyError({ message: "Zod validation error" }).isTransient, false, "Zod error must be permanent");

  // Transient errors (at most 1 retry permitted)
  assert.equal(classifyError({ status: 429 }).isTransient, true, "429 Rate Limit must be transient");
  assert.equal(classifyError({ status: 503 }).isTransient, true, "503 Service Unavailable must be transient");
  assert.equal(classifyError({ status: 500 }).isTransient, true, "500 Internal Server Error must be transient");
  assert.equal(classifyError({ message: "Request timed out after 15000ms" }).isTransient, true, "Timeout must be transient");
  assert.equal(classifyError({ message: "ETIMEDOUT" }).isTransient, true, "ETIMEDOUT must be transient");
});

test("Reliability: Permanent errors fail immediately without retry", async () => {
  let callCount = 0;

  await assert.rejects(
    async () => {
      await executeAIRequest(
        async () => {
          callCount++;
          const err = new Error("Invalid API key");
          err.status = 401;
          throw err;
        },
        { serviceName: "test_permanent" }
      );
    },
    (err) => {
      assert(err instanceof PermanentAIError);
      return true;
    }
  );

  assert.equal(callCount, 1, "Permanent error must be attempted exactly once with ZERO retries");
});

test("Reliability: Transient error retries at most ONCE, bounded to 2 attempts max", async () => {
  let callCount = 0;

  await assert.rejects(
    async () => {
      await executeAIRequest(
        async () => {
          callCount++;
          const err = new Error("Rate limit exceeded");
          err.status = 429;
          throw err;
        },
        { serviceName: "test_transient_exhausted", timeoutMs: 3000 }
      );
    },
    (err) => {
      assert(err.message.includes("Rate limit"));
      return true;
    }
  );

  assert.equal(callCount, 2, "Transient error must be retried at most ONCE (total 2 attempts max, never loops)");
});

test("Reliability: Transient error succeeds on allowed retry", async () => {
  let callCount = 0;

  const result = await executeAIRequest(
    async () => {
      callCount++;
      if (callCount === 1) {
        const err = new Error("Temporary network glitch");
        err.status = 503;
        throw err;
      }
      return { score: 85, feedback: "Excellent answer" };
    },
    { serviceName: "test_transient_recovery", timeoutMs: 3000 }
  );

  assert.equal(callCount, 2, "Should attempt twice and succeed on second attempt");
  assert.equal(result.score, 85);
});

test("Reliability: Circuit breaker trips after 3 consecutive failures and blocks requests", async () => {
  const service = "test_circuit_breaker";

  // Simulate 3 failures
  recordCircuitFailure(service);
  recordCircuitFailure(service);
  recordCircuitFailure(service);

  // Next call should immediately trip circuit breaker
  await assert.rejects(
    async () => {
      checkCircuitBreaker(service);
    },
    (err) => {
      assert(err instanceof CircuitBreakerOpenError);
      assert(err.cooldownRemainingMs > 0);
      assert(err.message.includes("Circuit breaker is OPEN"));
      return true;
    }
  );
});

test("Reliability: In-Flight locking prevents concurrent duplicate submissions", async () => {
  const actionId = "turn:session-123:round-1:idx-2";

  // Start first simulated in-flight AI call
  let resolveFirst;
  const firstPromise = executeAIRequest(
    async () => {
      return new Promise((resolve) => {
        resolveFirst = resolve;
      });
    },
    { actionId, timeoutMs: 5000, serviceName: "test_flight" }
  );

  // Immediate second call with identical actionId must reject with InFlightRequestConflictError
  await assert.rejects(
    async () => {
      await executeAIRequest(
        async () => ({ done: true }),
        { actionId, timeoutMs: 5000, serviceName: "test_flight" }
      );
    },
    (err) => {
      assert(err instanceof InFlightRequestConflictError);
      assert(err.message.includes("already in progress"));
      return true;
    }
  );

  // Complete first request
  resolveFirst({ done: true });
  await firstPromise;

  // After first request completes, subsequent call is permitted
  const thirdCall = await executeAIRequest(
    async () => ({ done: true }),
    { actionId, timeoutMs: 5000, serviceName: "test_flight" }
  );
  assert.equal(thirdCall.done, true);
});

test("Reliability: Compiler pre-execution validation enforces < 64KB code and < 10KB stdin", () => {
  // Valid payload within size limits
  assert.doesNotThrow(() => {
    validateExecutionPayload("public class Solution {}", "1 2 3");
  });

  // Code exceeding 64 KB
  const oversizedCode = "a".repeat(65 * 1024);
  assert.throws(
    () => {
      validateExecutionPayload(oversizedCode, "stdin");
    },
    (err) => {
      assert(err instanceof CodePayloadTooLargeError);
      assert(err.message.includes("exceeds the 64 KB limit"));
      return true;
    }
  );

  // Input data exceeding 10 KB
  const oversizedStdin = "x".repeat(11 * 1024);
  assert.throws(
    () => {
      validateExecutionPayload("int x = 1;", oversizedStdin);
    },
    (err) => {
      assert(err instanceof CodePayloadTooLargeError);
      assert(err.message.includes("exceeds the 10 KB limit"));
      return true;
    }
  );
});

test("Reliability: Compiler deduplication prevents parallel duplicate execution", () => {
  const code = "print('hello')";
  const stdin = "test_in";

  const lockKey = acquireExecutionLock("python", code, stdin);
  assert.ok(lockKey);

  // Attempt duplicate execution
  assert.throws(
    () => {
      acquireExecutionLock("python", code, stdin);
    },
    (err) => {
      assert(err instanceof DuplicateExecutionError);
      return true;
    }
  );

  releaseExecutionLock(lockKey);

  // After release, allowed again
  const secondLock = acquireExecutionLock("python", code, stdin);
  assert.ok(secondLock);
  releaseExecutionLock(secondLock);
});

test("Reliability: Compiler unreachable message matches required specification verbatim", () => {
  const expectedText =
    "Code execution could not be completed because the compiler service did not respond. Your code has been preserved. No successful execution was confirmed.";
  assert.equal(COMPILER_UNREACHABLE_MESSAGE, expectedText);
});
