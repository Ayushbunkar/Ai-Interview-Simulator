import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { questions, bookmarks } from "@/lib/db/schema";
import { eq, like, and, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const company = searchParams.get("company");
    const search = searchParams.get("search");

    let allQuestions = await db.select().from(questions);

    // Filter in-memory for flexible JSON search
    if (category && category !== "all") {
      allQuestions = allQuestions.filter(q => q.category === category);
    }
    if (difficulty && difficulty !== "all") {
      allQuestions = allQuestions.filter(q => q.difficulty === difficulty);
    }
    if (company && company !== "all") {
      allQuestions = allQuestions.filter(q => {
        try {
          const tags: string[] = JSON.parse(q.companyTags);
          return tags.some(t => t.toLowerCase().includes(company.toLowerCase()));
        } catch {
          return false;
        }
      });
    }
    if (search && search.trim().length > 0) {
      const s = search.toLowerCase();
      allQuestions = allQuestions.filter(
        q =>
          q.questionText.toLowerCase().includes(s) ||
          q.topic.toLowerCase().includes(s) ||
          q.explanation.toLowerCase().includes(s)
      );
    }

    // Get bookmark IDs
    const bookmarkedRows = await db.select().from(bookmarks).where(eq(bookmarks.itemType, "question"));
    const bookmarkSet = new Set(bookmarkedRows.map(b => b.itemId));

    const sanitized = allQuestions.map(q => ({
      id: q.id,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      companyTags: JSON.parse(q.companyTags || "[]"),
      questionText: q.questionText,
      expectedAnswer: q.expectedAnswer,
      explanation: q.explanation,
      followUps: JSON.parse(q.followUps || "[]"),
      isBookmarked: bookmarkSet.has(q.id),
      createdAt: q.createdAt,
    }));

    return NextResponse.json({
      total: sanitized.length,
      questions: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
