import { NextRequest, NextResponse } from "next/server";
import { evaluateSpokenAnswer, SpeechEvaluationInput } from "@/lib/assessment/speech-articulation-evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SpeechEvaluationInput;

    if (!body || !body.question) {
      return NextResponse.json(
        { error: "Invalid request: question is required." },
        { status: 400 }
      );
    }

    const evaluation = await evaluateSpokenAnswer({
      transcript: body.transcript || "",
      question: body.question,
      modelAnswer: body.modelAnswer || "",
      keyPoints: Array.isArray(body.keyPoints) ? body.keyPoints : [],
      audioDurationSeconds: body.audioDurationSeconds || 15,
      mode: body.mode || "initial",
      previousScore: typeof body.previousScore === "number" ? body.previousScore : undefined,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("Speech evaluation API error:", error);
    return NextResponse.json(
      {
        error: "Failed to evaluate speech articulation",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
