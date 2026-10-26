import { CodeExecutionProvider, ExecutionRequest, ExecutionResponse } from "./interface";
import { COMPILER_UNREACHABLE_MESSAGE, validateExecutionPayload } from "../reliability/compiler-safeguards";

const LANGUAGE_ID_MAP: Record<"java" | "python" | "cpp", number> = {
  java: 91,    // OpenJDK 25 / standard Java
  python: 113, // Python 3.14 / standard Python
  cpp: 105,    // C++ (GCC 15)
};

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1000;

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

    // Pre-execution payload validation (< 64KB code, < 10KB stdin)
    try {
      validateExecutionPayload(request.sourceCode, request.stdin);
    } catch (err: any) {
      return {
        success: false,
        status: { id: 13, description: "Payload Too Large" },
        error: err.message,
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

      if (!response.ok) {
        clearTimeout(timeout);
        // If HTTP 5xx or 502/503/504, return exact compiler service error message
        if (response.status >= 500) {
          return {
            success: false,
            status: { id: 13, description: `HTTP ${response.status}` },
            error: COMPILER_UNREACHABLE_MESSAGE,
          };
        }
        const errorText = await response.text();
        return {
          success: false,
          status: { id: 13, description: `HTTP ${response.status}` },
          error: `Execution service error (${response.status}): ${errorText}`,
        };
      }

      let data = await response.json();

      // If Judge0 returns in queue or processing (status.id 1 or 2), perform bounded polling without re-submitting code
      if (data.token && (data.status?.id === 1 || data.status?.id === 2)) {
        let pollCount = 0;
        while (pollCount < MAX_POLL_ATTEMPTS && (data.status?.id === 1 || data.status?.id === 2)) {
          pollCount++;
          await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
          if (controller.signal.aborted) break;

          const pollRes = await fetch(`${this.baseUrl}/submissions/${data.token}`, {
            headers: { "X-Auth-Token": this.apiKey },
            signal: controller.signal,
          });

          if (pollRes.ok) {
            data = await pollRes.json();
          } else if (pollRes.status >= 500) {
            clearTimeout(timeout);
            return {
              success: false,
              status: { id: 13, description: `HTTP ${pollRes.status}` },
              error: COMPILER_UNREACHABLE_MESSAGE,
            };
          }
        }
      }

      clearTimeout(timeout);

      // If status is still pending after max polls, return bounded timeout
      if (data.status?.id === 1 || data.status?.id === 2) {
        return {
          success: false,
          status: { id: 5, description: "Time Limit Exceeded" },
          error: COMPILER_UNREACHABLE_MESSAGE,
        };
      }

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
      return {
        success: false,
        status: { id: 13, description: "Compiler Unreachable" },
        error: COMPILER_UNREACHABLE_MESSAGE,
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
