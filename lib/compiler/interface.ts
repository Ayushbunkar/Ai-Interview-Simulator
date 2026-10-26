export interface ExecutionRequest {
  language: "java" | "python" | "cpp";
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
  timeoutMs?: number;
}

export interface ExecutionResponse {
  success: boolean;
  token?: string;
  time?: number; // seconds
  memory?: number; // KB
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  message?: string | null;
  status: {
    id: number;
    description: string;
  };
  error?: string;
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  memoryKb?: number;
  error?: string;
  isHidden?: boolean;
}

export interface ProblemEvaluationResult {
  status: "accepted" | "wrong_answer" | "compilation_error" | "runtime_error" | "time_limit_exceeded" | "unconfigured" | "system_error";
  passedCount: number;
  totalCount: number;
  runtimeMs?: number;
  memoryKb?: number;
  compileOutput?: string;
  errorMessage?: string;
  testResults: TestCaseResult[];
}

export interface CodeExecutionProvider {
  name: string;
  isConfigured(): boolean;
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
  testConnection(): Promise<{ success: boolean; message: string; version?: string }>;
}
