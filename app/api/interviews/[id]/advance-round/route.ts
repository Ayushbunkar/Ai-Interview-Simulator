import { NextRequest, NextResponse } from "next/server";
import { advanceToNextRound } from "@/lib/interview/engine";
import { RoundNumber } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    let targetRound: RoundNumber | undefined = undefined;
    try {
      const body = await request.json();
      if (body && typeof body.targetRound === "number") {
        targetRound = body.targetRound as RoundNumber;
      }
    } catch {
      // No JSON body provided, defaults to next round
    }

    const result = await advanceToNextRound(sessionId, targetRound);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to advance round" }, { status: 500 });
  }
}
