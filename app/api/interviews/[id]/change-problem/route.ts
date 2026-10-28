import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, conversationMessages, codingProblems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { selectRandomCodingProblem } from "@/lib/interview/coding-selector";

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

    // Find current active problem slug to exclude it so user always gets a DIFFERENT question
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(and(eq(conversationMessages.sessionId, sessionId), eq(conversationMessages.roundNumber, 3)));

    const round3Msg = [...messages].reverse().find(
      m => m.sender === "interviewer" && m.metadata
    );

    let currentSlug = "";
    if (round3Msg?.metadata) {
      try {
        const meta = typeof round3Msg.metadata === "string" ? JSON.parse(round3Msg.metadata) : round3Msg.metadata;
        currentSlug = meta.problemSlug || meta.problemId || "";
      } catch {
        // ignore
      }
    }

    // Select a new random problem matching company profile (TCS, Capgemini, etc.), excluding the current one
    const newProblem = await selectRandomCodingProblem({
      companyProfile: session.companyProfile,
      difficulty: session.difficulty,
      excludeSlugs: currentSlug ? [currentSlug] : [],
    });

    const newQuestionText = `Switched coding challenge: **${newProblem.title}** (${newProblem.difficulty.toUpperCase()}).\n\n` +
      `${newProblem.description}\n\n` +
      `Explain your algorithmic approach aloud and write your solution in the editor pane.`;

    // Record the newly chosen problem in conversationMessages
    await db.insert(conversationMessages).values({
      id: "msg-" + Math.random().toString(36).substring(2, 10),
      sessionId,
      roundNumber: 3,
      sender: "interviewer",
      messageType: "question",
      content: newQuestionText,
      metadata: JSON.stringify({
        problemId: newProblem.id,
        problemSlug: newProblem.slug,
        switchedAt: new Date().toISOString(),
      }),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      problem: newProblem,
      message: `Problem changed to ${newProblem.title} (${session.companyProfile} format)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
