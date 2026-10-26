import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompilerProvider } from "@/lib/compiler";
import { prepareExecutionSource } from "@/lib/compiler/harness";

const RunCodeSchema = z.object({
  language: z.enum(["java", "python", "cpp"]),
  code: z.string().min(1, "Code cannot be empty"),
  stdin: z.string().optional().default(""),
  problemSlug: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RunCodeSchema.parse(body);

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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
