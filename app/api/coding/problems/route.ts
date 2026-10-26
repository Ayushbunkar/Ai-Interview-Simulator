import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { codingProblems, bookmarks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { STATIC_CODING_PROBLEMS } from "@/lib/fallback/data-source";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const difficulty = searchParams.get("difficulty");
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");

    let problems: any[] = [];
    let bookmarkSet = new Set<string>();

    if (process.env.DATABASE_URL) {
      try {
        await ensureDbInitialized();
        problems = await db.select().from(codingProblems);
        const bookmarkedRows = await db
          .select()
          .from(bookmarks)
          .where(eq(bookmarks.itemType, "problem"));
        bookmarkSet = new Set(bookmarkedRows.map(b => b.itemId));
      } catch (dbErr) {
        console.warn("Neon DB coding problems query error, falling back to static problems:", dbErr);
        problems = [];
      }
    }

    // Fall back to bundled 60 coding problems
    if (!problems || problems.length === 0) {
      problems = STATIC_CODING_PROBLEMS.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topicTags: JSON.stringify(p.topicTags || []),
        description: p.description,
        timeComplexity: p.timeComplexity,
        spaceComplexity: p.spaceComplexity,
        createdAt: new Date(),
      }));
    }

    if (difficulty && difficulty !== "all") {
      problems = problems.filter(p => p.difficulty === difficulty);
    }
    if (topic && topic !== "all") {
      problems = problems.filter(p => {
        try {
          const tags: string[] = typeof p.topicTags === "string" ? JSON.parse(p.topicTags) : (p.topicTags || []);
          return tags.some(t => t.toLowerCase().includes(topic.toLowerCase()));
        } catch {
          return false;
        }
      });
    }
    if (search && search.trim().length > 0) {
      const s = search.toLowerCase();
      problems = problems.filter(
        p => p.title?.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s))
      );
    }

    // Never return hidden test cases or reference solutions here
    const sanitized = problems.map(p => {
      let tags: string[] = [];
      try {
        tags = typeof p.topicTags === "string" ? JSON.parse(p.topicTags || "[]") : (p.topicTags || []);
      } catch {
        tags = [];
      }

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topicTags: tags,
        timeComplexity: p.timeComplexity,
        spaceComplexity: p.spaceComplexity,
        isBookmarked: bookmarkSet.has(p.id),
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      total: sanitized.length,
      problems: sanitized,
    });
  } catch (error: any) {
    console.error("Critical error in /api/coding/problems, fallback active:", error);
    const sanitized = STATIC_CODING_PROBLEMS.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topicTags: p.topicTags,
      timeComplexity: p.timeComplexity,
      spaceComplexity: p.spaceComplexity,
      isBookmarked: false,
      createdAt: new Date(),
    }));
    return NextResponse.json({
      total: sanitized.length,
      problems: sanitized,
    });
  }
}
