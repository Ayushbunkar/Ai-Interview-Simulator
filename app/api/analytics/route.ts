import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, interviewReports, codeSubmissions, candidateAnswers, questions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();

    // 1. Completed Interviews
    const allSessions = await db.select().from(interviewSessions);
    const completedSessions = allSessions.filter(s => s.status === "completed" && s.totalScore !== null);
    const totalCompleted = completedSessions.length;

    const avgScore = totalCompleted > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.totalScore || 0), 0) / totalCompleted)
      : 0;

    // 2. Coding Submissions & Accuracy
    const allSubmissions = await db.select().from(codeSubmissions);
    const totalSubmissions = allSubmissions.length;
    const acceptedSubmissions = allSubmissions.filter(s => s.status === "accepted").length;
    const codingAccuracy = totalSubmissions > 0
      ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
      : 0;

    // 3. Question Bank counts
    const allQuestions = await db.select({ id: questions.id, category: questions.category }).from(questions);
    const totalQuestionsCount = allQuestions.length;

    // 4. Strongest & Weakest Subjects based on candidate answers
    const answers = await db.select().from(candidateAnswers);
    const roundCategoryScores: Record<string, { total: number; count: number }> = {};

    for (const a of answers) {
      if (a.evaluationScore !== null) {
        const roundKey = a.roundNumber === 1 ? "Fundamentals & OOP" :
                         a.roundNumber === 2 ? "System Architecture & CS" :
                         a.roundNumber === 3 ? "Problem Solving & DSA" : "Behavioral & STAR";
        if (!roundCategoryScores[roundKey]) {
          roundCategoryScores[roundKey] = { total: 0, count: 0 };
        }
        roundCategoryScores[roundKey].total += a.evaluationScore;
        roundCategoryScores[roundKey].count += 1;
      }
    }

    const subjectAverages = Object.entries(roundCategoryScores).map(([name, data]) => ({
      name,
      average: Math.round(data.total / data.count),
      count: data.count,
    })).sort((a, b) => b.average - a.average);

    const strongestSubjects = subjectAverages.slice(0, 2);
    const weakestSubjects = subjectAverages.slice(-2).reverse();

    // 5. Recent Reports
    const recentReports = await db
      .select({
        id: interviewReports.id,
        sessionId: interviewReports.sessionId,
        overallScore: interviewReports.overallScore,
        readinessLevel: interviewReports.readinessLevel,
        createdAt: interviewReports.createdAt,
        title: interviewSessions.title,
        targetRole: interviewSessions.targetRole,
        companyProfile: interviewSessions.companyProfile,
      })
      .from(interviewReports)
      .leftJoin(interviewSessions, eq(interviewReports.sessionId, interviewSessions.id))
      .orderBy(desc(interviewReports.createdAt))
      .limit(5);

    // 6. Recommended practice topics based on weakest areas or defaults
    const recommendedTopics = weakestSubjects.length > 0
      ? weakestSubjects.map(w => w.name)
      : ["Java Fundamentals & OOP", "SQL Joins & Indexing", "System Design Patterns", "STAR Behavioral Communication"];

    return NextResponse.json({
      totalCompleted,
      averageScore: avgScore,
      totalSubmissions,
      acceptedSubmissions,
      codingAccuracy,
      totalQuestionsCount,
      strongestSubjects,
      weakestSubjects,
      recentReports,
      recommendedTopics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
