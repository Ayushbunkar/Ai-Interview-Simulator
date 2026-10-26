import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { submitCandidateAnswer } from "@/lib/interview/engine";
import { CircuitBreakerOpenError, InFlightRequestConflictError } from "@/lib/reliability/ai-request-manager";

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
    if (error instanceof InFlightRequestConflictError) {
      return NextResponse.json(
        { error: error.message, code: "IN_FLIGHT_CONFLICT", draftPreserved: true },
        { status: 409 }
      );
    }
    if (error instanceof CircuitBreakerOpenError) {
      return NextResponse.json(
        { error: error.message, code: "CIRCUIT_BREAKER_OPEN", draftPreserved: true, cooldownRemainingMs: error.cooldownRemainingMs },
        { status: 503 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const isServiceFail = (error.message || "").toLowerCase().includes("ai evaluation service failed");
    return NextResponse.json(
      { error: error.message, draftPreserved: true, recoverable: true },
      { status: isServiceFail ? 503 : 500 }
    );
  }
}
