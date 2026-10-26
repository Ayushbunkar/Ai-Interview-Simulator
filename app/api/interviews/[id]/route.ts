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

    // Default coding problem if in Round 3
    let activeCodingProblem = null;
    if (session.currentRound === 3) {
      const [problem] = await db.select().from(codingProblems).limit(1);
      if (problem) {
        activeCodingProblem = {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          topicTags: JSON.parse(problem.topicTags || "[]"),
          description: problem.description,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: JSON.parse(problem.constraints || "[]"),
          examples: JSON.parse(problem.examples || "[]"),
          hints: JSON.parse(problem.hints || "[]"),
          starterCodeJava: problem.starterCodeJava,
          starterCodePython: problem.starterCodePython,
          starterCodeCpp: problem.starterCodeCpp,
        };
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
