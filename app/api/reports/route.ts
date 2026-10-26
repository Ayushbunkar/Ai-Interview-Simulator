import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewReports, interviewSessions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();

    const reports = await db
      .select({
        id: interviewReports.id,
        sessionId: interviewReports.sessionId,
        overallScore: interviewReports.overallScore,
        readinessLevel: interviewReports.readinessLevel,
        readinessSummary: interviewReports.readinessSummary,
        createdAt: interviewReports.createdAt,
        title: interviewSessions.title,
        targetRole: interviewSessions.targetRole,
        companyProfile: interviewSessions.companyProfile,
        difficulty: interviewSessions.difficulty,
        mode: interviewSessions.mode,
      })
      .from(interviewReports)
      .leftJoin(interviewSessions, eq(interviewReports.sessionId, interviewSessions.id))
      .orderBy(desc(interviewReports.createdAt))
      .limit(50);

    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
