import { CodeExecutionProvider, ExecutionRequest, ExecutionResponse } from "./interface";

const LANGUAGE_ID_MAP: Record<"java" | "python" | "cpp", number> = {
  java: 91,    // OpenJDK 25 / standard Java
  python: 113, // Python 3.14 / standard Python
  cpp: 105,    // C++ (GCC 15)
};

export class OnlineCompilerProvider implements CodeExecutionProvider {
  name = "OnlineCompiler.io";
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ONLINECOMPILER_API_KEY || "";
    this.baseUrl = (process.env.ONLINECOMPILER_API_URL || "https://api.onlinecompiler.io/api/judge0").replace(/\/+$/, "");
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: { id: 14, description: "Unconfigured" },
        error: "OnlineCompiler API key is not configured. Set ONLINECOMPILER_API_KEY in your settings or .env.local file.",
      };
    }

    const languageId = LANGUAGE_ID_MAP[request.language] || 91;
    const url = `${this.baseUrl}/submissions?wait=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs || 20000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": this.apiKey,
        },
        body: JSON.stringify({
          language_id: languageId,
          source_code: request.sourceCode,
          stdin: request.stdin || "",
          expected_output: request.expectedOutput || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          status: { id: 13, description: `HTTP ${response.status}` },
          error: `Execution service error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        success: data.status?.id === 3,
        token: data.token,
        time: data.time ? parseFloat(data.time) : undefined,
        memory: data.memory ? parseInt(data.memory, 10) : undefined,
        stdout: data.stdout,
        stderr: data.stderr,
        compileOutput: data.compile_output,
        message: data.message,
        status: data.status || { id: 0, description: "Unknown" },
      };
    } catch (err: unknown) {
      clearTimeout(timeout);
      const isAbort = (err as Error)?.name === "AbortError";
      return {
        success: false,
        status: { id: 5, description: isAbort ? "Time Limit Exceeded" : "Network Error" },
        error: isAbort ? "Execution timed out (exceeded limit)" : ((err as Error)?.message || "Unknown error during code execution"),
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; version?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "ONLINECOMPILER_API_KEY is not configured.",
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/languages`, {
        headers: {
          "X-Auth-Token": this.apiKey,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          message: `Failed to connect: HTTP ${res.status} ${res.statusText}`,
        };
      }

      const languages = await res.json();
      return {
        success: true,
        message: `Successfully connected! ${Array.isArray(languages) ? languages.length : 0} language runtimes supported.`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Connection failed: ${(err as Error)?.message || "Network error"}`,
      };
    }
  }
}
