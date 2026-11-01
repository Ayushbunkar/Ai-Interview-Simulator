import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, interviewSessions, codeSubmissions, questions, codingProblems, apiUsageLogs } from "@/lib/db/schema";
import { sql, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await ensureDbInitialized();

    const [
      totalUsersRes,
      verifiedUsersRes,
      adminUsersRes,
      totalSessionsRes,
      completedSessionsRes,
      totalCodeSubmissionsRes,
      questionsRes,
      problemsRes,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.emailVerified, true)),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin")),
      db.select({ count: sql<number>`count(*)` }).from(interviewSessions),
      db.select({ count: sql<number>`count(*)` }).from(interviewSessions).where(eq(interviewSessions.status, "completed")),
      db.select({ count: sql<number>`count(*)` }).from(codeSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(questions),
      db.select({ count: sql<number>`count(*)` }).from(codingProblems),
    ]);

    const recentLogs = await db
      .select()
      .from(apiUsageLogs)
      .orderBy(desc(apiUsageLogs.createdAt))
      .limit(10);

    const recentSessions = await db
      .select({
        id: interviewSessions.id,
        title: interviewSessions.title,
        targetRole: interviewSessions.targetRole,
        companyProfile: interviewSessions.companyProfile,
        difficulty: interviewSessions.difficulty,
        status: interviewSessions.status,
        totalScore: interviewSessions.totalScore,
        createdAt: interviewSessions.createdAt,
      })
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt))
      .limit(8);

    return NextResponse.json({
      stats: {
        totalUsers: Number(totalUsersRes[0]?.count || 0),
        verifiedUsers: Number(verifiedUsersRes[0]?.count || 0),
        adminUsers: Number(adminUsersRes[0]?.count || 0),
        totalSessions: Number(totalSessionsRes[0]?.count || 0),
        completedSessions: Number(completedSessionsRes[0]?.count || 0),
        totalSubmissions: Number(totalCodeSubmissionsRes[0]?.count || 0),
        totalQuestions: Number(questionsRes[0]?.count || 0),
        totalProblems: Number(problemsRes[0]?.count || 0),
      },
      recentLogs,
      recentSessions,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (err.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
