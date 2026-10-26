import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompilerProvider } from "@/lib/compiler";
import { prepareExecutionSource } from "@/lib/compiler/harness";
import { logAPIUsage } from "@/lib/ai/usage-tracker";
import {
  validateExecutionPayload,
  acquireExecutionLock,
  releaseExecutionLock,
  DuplicateExecutionError,
  CodePayloadTooLargeError,
} from "@/lib/reliability/compiler-safeguards";

const RunCodeSchema = z.object({
  language: z.enum(["java", "python", "cpp"]),
  code: z.string().min(1, "Code cannot be empty"),
  stdin: z.string().optional().default(""),
  problemSlug: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let lockKey: string | null = null;
  try {
    const body = await request.json();
    const validated = RunCodeSchema.parse(body);

    // 1. Pre-execution payload validation (< 64KB code, < 10KB stdin)
    validateExecutionPayload(validated.code, validated.stdin);

    // 2. Concurrency deduplication lock
    lockKey = acquireExecutionLock(validated.language, validated.code, validated.stdin);

    const provider = getCompilerProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          error: "OnlineCompiler API is not configured. Set ONLINECOMPILER_API_KEY in Settings or .env.local to execute code.",
        },
        { status: 400 }
      );
    }

    const preparedCode = prepareExecutionSource({
      language: validated.language,
      code: validated.code,
      problemSlug: validated.problemSlug,
    });

    const result = await provider.execute({
      language: validated.language,
      sourceCode: preparedCode,
      stdin: validated.stdin,
      timeoutMs: 15000,
    });

    await logAPIUsage({
      service: "onlinecompiler",
      endpoint: "/api/coding/run",
      modelOrLang: validated.language,
      status: result.success ? "success" : "error",
      responseTimeMs: Math.round(Number(result.time || "0.2") * 1000),
      errorMessage: result.error || result.stderr || undefined,
    });

    return NextResponse.json({
      configured: true,
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      time: result.time,
      memory: result.memory,
      status: result.status,
      error: result.error,
    });
  } catch (error: any) {
    if (error instanceof DuplicateExecutionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CodePayloadTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (lockKey) {
      releaseExecutionLock(lockKey);
    }
  }
}
