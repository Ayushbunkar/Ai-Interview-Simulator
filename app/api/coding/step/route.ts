import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { logCodingStep, getProblemSolvingTimeline, generateCodingInterviewerProbe } from "@/lib/coding/coding-tracker";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { sessionId, problemId, stepType, content, metadata } = body;

    if (!sessionId || !problemId || !stepType || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const step = await logCodingStep({
      sessionId,
      problemId,
      stepType,
      content,
      metadata,
    });

    const probe = generateCodingInterviewerProbe({
      hasApproach: true,
      hasCode: stepType === "code_revision",
      claimedComplexity: stepType === "complexity_stated" ? content : undefined,
    });

    return NextResponse.json({ success: true, step, probe });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const problemId = searchParams.get("problemId");

    if (!sessionId || !problemId) {
      return NextResponse.json({ error: "sessionId and problemId are required" }, { status: 400 });
    }

    const timeline = await getProblemSolvingTimeline(sessionId, problemId);
    return NextResponse.json({ timeline });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
