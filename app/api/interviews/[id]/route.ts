import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import {
  interviewSessions,
  interviewRounds,
  conversationMessages,
  candidateAnswers,
  interviewReports,
  codingProblems,
  interviewBlueprints,
  codingStepsLog,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { selectRandomCodingProblem, formatProblemRecord } from "@/lib/interview/coding-selector";

export const dynamic = "force-dynamic";

export async function GET(
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

    const rounds = await db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.sessionId, sessionId))
      .orderBy(asc(interviewRounds.roundNumber));

    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.sessionId, sessionId))
      .orderBy(asc(conversationMessages.timestamp));

    const answers = await db
      .select()
      .from(candidateAnswers)
      .where(eq(candidateAnswers.sessionId, sessionId));

    // If report exists
    const [report] = await db
      .select()
      .from(interviewReports)
      .where(eq(interviewReports.sessionId, sessionId));

    // Active coding problem if in Round 3
    let activeCodingProblem = null;
    if (session.currentRound === 3) {
      // Find assigned problem in conversation messages
      const round3Msg = [...messages].reverse().find(
        m => m.roundNumber === 3 && m.sender === "interviewer" && m.metadata
      );

      let targetSlug = "";
      let targetId = "";
      if (round3Msg?.metadata) {
        try {
          const meta = typeof round3Msg.metadata === "string" ? JSON.parse(round3Msg.metadata) : round3Msg.metadata;
          if (meta.problemSlug) targetSlug = meta.problemSlug;
          if (meta.problemId) targetId = meta.problemId;
        } catch {
          // ignore
        }
      }

      let problem: any = null;
      if (targetSlug) {
        const [found] = await db.select().from(codingProblems).where(eq(codingProblems.slug, targetSlug));
        problem = found;
      } else if (targetId) {
        const [found] = await db.select().from(codingProblems).where(eq(codingProblems.id, targetId));
        problem = found;
      }

      // If not yet set, pick random problem tailored for this company & difficulty
      if (!problem) {
        activeCodingProblem = await selectRandomCodingProblem({
          companyProfile: session.companyProfile,
          difficulty: session.difficulty,
        });
      } else {
        activeCodingProblem = formatProblemRecord(problem);
      }
    }

    return NextResponse.json({
      session: {
        ...session,
        topicsEmphasized: JSON.parse(session.topicsEmphasized || "[]"),
      },
      rounds,
      messages: messages.map(m => ({
        id: m.id,
        roundNumber: m.roundNumber,
        sender: m.sender,
        messageType: m.messageType,
        content: m.content,
        metadata: m.metadata ? JSON.parse(m.metadata) : null,
        timestamp: m.timestamp,
      })),
      answersCount: answers.length,
      reportId: report?.id || null,
      activeCodingProblem,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const sessionId = params.id;

    // Delete associated records with foreign key dependencies
    await db.delete(interviewReports).where(eq(interviewReports.sessionId, sessionId));
    await db.delete(interviewBlueprints).where(eq(interviewBlueprints.sessionId, sessionId));
    await db.delete(codingStepsLog).where(eq(codingStepsLog.sessionId, sessionId));
    await db.delete(conversationMessages).where(eq(conversationMessages.sessionId, sessionId));
    await db.delete(candidateAnswers).where(eq(candidateAnswers.sessionId, sessionId));
    await db.delete(interviewRounds).where(eq(interviewRounds.sessionId, sessionId));
    await db.delete(interviewSessions).where(eq(interviewSessions.id, sessionId));

    return NextResponse.json({ success: true, deletedSessionId: sessionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
