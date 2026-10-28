import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, conversationMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getNextQuestionForRound } from "@/lib/interview/engine";
import { RoundNumber } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const sessionId = params.id;

    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const currentRound = (session.currentRound || 1) as RoundNumber;
    const currentIdx = session.currentQuestionIndex || 0;

    // Fetch a new random question tailored for this company and round
    const newQ = await getNextQuestionForRound(sessionId, currentRound, currentIdx, {
      companyProfile: session.companyProfile,
      targetRole: session.targetRole,
      resumeProfileId: session.resumeProfileId || undefined,
    });

    const switchNotice = `Let's switch to another question for Round ${currentRound} (${session.companyProfile} style):\n\n${newQ.questionText}`;

    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: currentRound,
      sender: "interviewer",
      messageType: "question",
      content: switchNotice,
      metadata: JSON.stringify({
        questionId: newQ.id,
        questionIndex: currentIdx,
        isSwitched: true,
        switchedAt: new Date().toISOString(),
      }),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      newQuestion: newQ,
      message: `Switched to question: ${newQ.questionText.slice(0, 60)}...`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
