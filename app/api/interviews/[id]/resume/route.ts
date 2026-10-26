import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, conversationMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const now = new Date();
    await db
      .update(interviewSessions)
      .set({
        isPaused: false,
        pausedAt: null,
      })
      .where(eq(interviewSessions.id, sessionId));

    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: session.currentRound,
      sender: "system",
      messageType: "instruction",
      content: "[Interview Resumed. Timer running.]",
      timestamp: now,
    });

    return NextResponse.json({ success: true, isPaused: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
