import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureDbInitialized } from "@/lib/db";
import { codingProblems, testCases, codeSubmissions, executionResults } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { evaluateCodeAgainstTestCases, getCompilerProvider } from "@/lib/compiler";
import { logAPIUsage } from "@/lib/ai/usage-tracker";
import { logCodingStep } from "@/lib/coding/coding-tracker";

const SubmitCodeSchema = z.object({
  problemSlug: z.string().min(1, "Problem slug is required"),
  language: z.enum(["java", "python", "cpp"]),
  code: z.string().min(1, "Code cannot be empty"),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const validated = SubmitCodeSchema.parse(body);

    const [problem] = await db
      .select()
      .from(codingProblems)
      .where(eq(codingProblems.slug, validated.problemSlug));

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const provider = getCompilerProvider();
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          configured: false,
          status: "unconfigured",
          message: "OnlineCompiler API is not configured. Real code execution requires ONLINECOMPILER_API_KEY in Settings.",
        },
        { status: 400 }
      );
    }

    // Fetch all test cases for this problem (visible and hidden)
    const problemTests = await db
      .select()
      .from(testCases)
      .where(eq(testCases.problemId, problem.id))
      .orderBy(asc(testCases.orderIndex));

    const evalResult = await evaluateCodeAgainstTestCases({
      language: validated.language,
      code: validated.code,
      problemSlug: problem.slug,
      testCases: problemTests.map(tc => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      })),
    });

    const submissionId = "sub-" + Math.random().toString(36).substring(2, 10);
    const now = new Date();

    // Record submission
    await db.insert(codeSubmissions).values({
      id: submissionId,
      sessionId: validated.sessionId || null,
      problemId: problem.id,
      language: validated.language,
      code: validated.code,
      status: evalResult.status,
      passedTests: evalResult.passedCount,
      totalTests: evalResult.totalCount,
      runtimeMs: evalResult.runtimeMs || null,
      memoryKb: evalResult.memoryKb || null,
      compileOutput: evalResult.compileOutput || null,
      errorMessage: evalResult.errorMessage || null,
      createdAt: now,
    });

    // Record individual execution results
    for (const tr of evalResult.testResults) {
      await db.insert(executionResults).values({
        id: "exec-" + Math.random().toString(36).substring(2, 10),
        submissionId,
        testCaseId: tr.testCaseId,
        passed: tr.passed,
        actualOutput: tr.actualOutput || null,
        expectedOutput: tr.expectedOutput || null,
        executionTimeMs: tr.executionTimeMs || null,
        memoryKb: tr.memoryKb || null,
        error: tr.error || null,
      });
    }

    // Log API usage and coding step
    await logAPIUsage({
      service: "onlinecompiler",
      endpoint: "/api/coding/submit",
      modelOrLang: validated.language,
      status: evalResult.status === "accepted" ? "success" : "error",
      responseTimeMs: Math.round(Number(evalResult.runtimeMs || 250)),
      errorMessage: evalResult.errorMessage || evalResult.compileOutput || undefined,
    });

    if (validated.sessionId) {
      await logCodingStep({
        sessionId: validated.sessionId,
        problemId: problem.id,
        stepType: "compiler_run",
        content: `Candidate executed compiler submission in ${validated.language}. Status: ${evalResult.status} (${evalResult.passedCount}/${evalResult.totalCount} passed).`,
        metadata: {
          submissionId,
          status: evalResult.status,
          passedCount: evalResult.passedCount,
          totalCount: evalResult.totalCount,
        },
      });
    }

    return NextResponse.json({
      configured: true,
      submissionId,
      status: evalResult.status,
      passedCount: evalResult.passedCount,
      totalCount: evalResult.totalCount,
      runtimeMs: evalResult.runtimeMs,
      memoryKb: evalResult.memoryKb,
      compileOutput: evalResult.compileOutput,
      errorMessage: evalResult.errorMessage,
      testResults: evalResult.testResults,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
