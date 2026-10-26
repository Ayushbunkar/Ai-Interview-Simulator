import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitCandidateAnswer } from "@/lib/interview/engine";

const AnswerSchema = z.object({
  answer: z.string().min(1, "Answer cannot be empty"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = AnswerSchema.parse(body);

    const result = await submitCandidateAnswer({
      sessionId: params.id,
      answerText: validated.answer,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
