import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import {
  interviewReports,
  interviewSessions,
  interviewRounds,
  candidateAnswers,
  codeSubmissions,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const reportId = params.id;

    const [report] = await db
      .select()
      .from(interviewReports)
      .where(eq(interviewReports.id, reportId));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const [session] = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.id, report.sessionId));

    const rounds = await db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.sessionId, report.sessionId))
      .orderBy(asc(interviewRounds.roundNumber));

    const answers = await db
      .select()
      .from(candidateAnswers)
      .where(eq(candidateAnswers.sessionId, report.sessionId))
      .orderBy(asc(candidateAnswers.createdAt));

    const submissions = await db
      .select()
      .from(codeSubmissions)
      .where(eq(codeSubmissions.sessionId, report.sessionId));

    return NextResponse.json({
      report: {
        id: report.id,
        sessionId: report.sessionId,
        overallScore: report.overallScore,
        roundScores: JSON.parse(report.roundScores || "[]"),
        technicalStrengths: JSON.parse(report.technicalStrengths || "[]"),
        areasForImprovement: JSON.parse(report.areasForImprovement || "[]"),
        communicationAssessment: report.communicationAssessment,
        codingAssessment: JSON.parse(report.codingAssessment || "{}"),
        sevenDayPlan: JSON.parse(report.sevenDayPlan || "[]"),
        readinessSummary: report.readinessSummary,
        readinessLevel: report.readinessLevel,
        markdownExport: report.markdownExport,
        createdAt: report.createdAt,
      },
      session,
      rounds,
      answers: answers.map(a => ({
        id: a.id,
        roundNumber: a.roundNumber,
        questionText: a.questionText,
        answerText: a.answerText,
        evaluationScore: a.evaluationScore,
        rubricBreakdown: a.rubricBreakdown ? JSON.parse(a.rubricBreakdown) : [],
        strengths: a.strengths ? JSON.parse(a.strengths) : [],
        weaknesses: a.weaknesses ? JSON.parse(a.weaknesses) : [],
        feedback: a.feedback,
        followUpAsked: a.followUpAsked,
        followUpAnswer: a.followUpAnswer,
      })),
      submissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
