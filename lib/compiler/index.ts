import { CodeExecutionProvider, ProblemEvaluationResult, TestCaseResult } from "./interface";
import { OnlineCompilerProvider } from "./onlinecompiler-provider";
import { prepareExecutionSource, compareOutputs } from "./harness";

let providerInstance: CodeExecutionProvider | null = null;

export function getCompilerProvider(): CodeExecutionProvider {
  if (!providerInstance) {
    providerInstance = new OnlineCompilerProvider();
  }
  return providerInstance;
}

export async function evaluateCodeAgainstTestCases(params: {
  language: "java" | "python" | "cpp";
  code: string;
  problemSlug?: string;
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
}): Promise<ProblemEvaluationResult> {
  const provider = getCompilerProvider();

  if (!provider.isConfigured()) {
    return {
      status: "unconfigured",
      passedCount: 0,
      totalCount: params.testCases.length,
      errorMessage: "OnlineCompiler API is not configured. Please add ONLINECOMPILER_API_KEY in Settings or .env.local to execute code.",
      testResults: [],
    };
  }

  const preparedSource = prepareExecutionSource({
    language: params.language,
    code: params.code,
    problemSlug: params.problemSlug,
  });

  const testResults: TestCaseResult[] = [];
  let passedCount = 0;
  let totalRuntime = 0;
  let maxMemory = 0;
  let hasCompilationError = false;
  let compilationErrorOutput = "";
  let hasRuntimeError = false;
  let runtimeErrorMessage = "";
  let hasTimeout = false;

  let hasSystemError = false;
  let systemErrorMessage = "";

  for (const tc of params.testCases) {
    const execRes = await provider.execute({
      language: params.language,
      sourceCode: preparedSource,
      stdin: tc.input,
      expectedOutput: tc.expectedOutput,
      timeoutMs: 15000,
    });

    // Check for compiler service unreachable/system error
    if (execRes.error && execRes.error.includes("compiler service did not respond")) {
      hasSystemError = true;
      systemErrorMessage = execRes.error;
      testResults.push({
        testCaseId: tc.id,
        passed: false,
        input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actualOutput: "",
        error: systemErrorMessage,
        isHidden: tc.isHidden,
      });
      break; // Abort remaining tests to prevent flooding unreachable compiler
    }

    if (execRes.compileOutput || (execRes.status.id === 6 || execRes.status.description.toLowerCase().includes("compilation error"))) {
      hasCompilationError = true;
      compilationErrorOutput = execRes.compileOutput || execRes.stderr || "Compilation failed";
      testResults.push({
        testCaseId: tc.id,
        passed: false,
        input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actualOutput: execRes.stdout || "",
        error: compilationErrorOutput,
        isHidden: tc.isHidden,
      });
      break; // No need to run further tests if compilation fails
    }

    if (execRes.status.id === 5 || execRes.status.description.toLowerCase().includes("time limit")) {
      hasTimeout = true;
      testResults.push({
        testCaseId: tc.id,
        passed: false,
        input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actualOutput: execRes.stdout || "",
        error: "Time Limit Exceeded",
        isHidden: tc.isHidden,
      });
      continue;
    }

    if (execRes.stderr || execRes.status.id >= 7) {
      hasRuntimeError = true;
      runtimeErrorMessage = execRes.stderr || execRes.message || execRes.status.description;
      testResults.push({
        testCaseId: tc.id,
        passed: false,
        input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
        actualOutput: execRes.stdout || "",
        error: runtimeErrorMessage,
        isHidden: tc.isHidden,
      });
      continue;
    }

    const passed = compareOutputs(execRes.stdout, tc.expectedOutput);
    if (passed) {
      passedCount++;
    }

    if (execRes.time) totalRuntime += execRes.time * 1000;
    if (execRes.memory && execRes.memory > maxMemory) maxMemory = execRes.memory;

    testResults.push({
      testCaseId: tc.id,
      passed,
      input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
      expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput,
      actualOutput: tc.isHidden && !passed ? "[Hidden Output]" : (execRes.stdout || ""),
      executionTimeMs: execRes.time ? Math.round(execRes.time * 1000) : undefined,
      memoryKb: execRes.memory,
      isHidden: tc.isHidden,
    });
  }

  let finalStatus: ProblemEvaluationResult["status"] = "accepted";
  if (hasSystemError) {
    finalStatus = "system_error";
  } else if (hasCompilationError) {
    finalStatus = "compilation_error";
  } else if (hasTimeout) {
    finalStatus = "time_limit_exceeded";
  } else if (hasRuntimeError && passedCount === 0) {
    finalStatus = "runtime_error";
  } else if (passedCount < params.testCases.length) {
    finalStatus = "wrong_answer";
  }

  return {
    status: finalStatus,
    passedCount,
    totalCount: params.testCases.length,
    runtimeMs: Math.round(totalRuntime),
    memoryKb: maxMemory,
    compileOutput: compilationErrorOutput || undefined,
    errorMessage: systemErrorMessage || runtimeErrorMessage || undefined,
    testResults,
  };
}
