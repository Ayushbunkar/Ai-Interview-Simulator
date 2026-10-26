import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { questions, bookmarks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STATIC_QUESTIONS } from "@/lib/fallback/data-source";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const company = searchParams.get("company");
    const search = searchParams.get("search");

    let allQuestions: any[] = [];
    let bookmarkSet = new Set<string>();

    if (process.env.DATABASE_URL) {
      try {
        await ensureDbInitialized();
        allQuestions = await db.select().from(questions);
        const bookmarkedRows = await db
          .select()
          .from(bookmarks)
          .where(eq(bookmarks.itemType, "question"));
        bookmarkSet = new Set(bookmarkedRows.map(b => b.itemId));
      } catch (dbErr) {
        console.warn("Neon DB questions query error, falling back to static questions:", dbErr);
        allQuestions = [];
      }
    }

    // If database returned 0 questions or failed -> seamlessly fall back to curated 200+ placement questions
    if (!allQuestions || allQuestions.length === 0) {
      allQuestions = STATIC_QUESTIONS.map(q => ({
        id: q.id,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        companyTags: JSON.stringify(q.companyTags || []),
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        explanation: q.explanation,
        followUps: JSON.stringify(q.followUps || []),
        rubricFocus: q.rubricFocus || null,
        createdAt: new Date(),
      }));
    }

    // Filter in-memory for flexible search & categorization
    if (category && category !== "all") {
      allQuestions = allQuestions.filter(q => q.category === category);
    }
    if (difficulty && difficulty !== "all") {
      allQuestions = allQuestions.filter(q => q.difficulty === difficulty);
    }
    if (company && company !== "all") {
      allQuestions = allQuestions.filter(q => {
        try {
          const tags: string[] = typeof q.companyTags === "string" ? JSON.parse(q.companyTags) : (q.companyTags || []);
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
          q.questionText?.toLowerCase().includes(s) ||
          q.topic?.toLowerCase().includes(s) ||
          q.explanation?.toLowerCase().includes(s)
      );
    }

    const sanitized = allQuestions.map(q => {
      let companyTagsArray: string[] = [];
      try {
        companyTagsArray = typeof q.companyTags === "string" ? JSON.parse(q.companyTags || "[]") : (q.companyTags || []);
      } catch {
        companyTagsArray = [];
      }

      let followUpsArray: string[] = [];
      try {
        followUpsArray = typeof q.followUps === "string" ? JSON.parse(q.followUps || "[]") : (q.followUps || []);
      } catch {
        followUpsArray = [];
      }

      return {
        id: q.id,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        companyTags: companyTagsArray,
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        explanation: q.explanation,
        followUps: followUpsArray,
        isBookmarked: bookmarkSet.has(q.id),
        createdAt: q.createdAt,
      };
    });

    return NextResponse.json({
      total: sanitized.length,
      questions: sanitized,
    });
  } catch (error: any) {
    console.error("Critical error in /api/questions, fallback active:", error);
    const sanitized = STATIC_QUESTIONS.map(q => ({
      ...q,
      isBookmarked: false,
      createdAt: new Date(),
    }));
    return NextResponse.json({
      total: sanitized.length,
      questions: sanitized,
    });
  }
}
