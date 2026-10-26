import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { askInterviewerQuestion } from "@/lib/interview/engine";

const AskSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = AskSchema.parse(body);

    const result = await askInterviewerQuestion({
      sessionId: params.id,
      candidateQuestion: validated.question,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
