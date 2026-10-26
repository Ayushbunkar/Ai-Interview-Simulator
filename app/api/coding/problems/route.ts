import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { codingProblems, bookmarks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);

    const difficulty = searchParams.get("difficulty");
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");

    let problems = await db.select().from(codingProblems);

    if (difficulty && difficulty !== "all") {
      problems = problems.filter(p => p.difficulty === difficulty);
    }
    if (topic && topic !== "all") {
      problems = problems.filter(p => {
        try {
          const tags: string[] = JSON.parse(p.topicTags);
          return tags.some(t => t.toLowerCase().includes(topic.toLowerCase()));
        } catch {
          return false;
        }
      });
    }
    if (search && search.trim().length > 0) {
      const s = search.toLowerCase();
      problems = problems.filter(
        p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
      );
    }

    const bookmarkedRows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.itemType, "problem"));
    const bookmarkSet = new Set(bookmarkedRows.map(b => b.itemId));

    // Never return hidden test cases or reference solutions here!
    const sanitized = problems.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      topicTags: JSON.parse(p.topicTags || "[]"),
      timeComplexity: p.timeComplexity,
      spaceComplexity: p.spaceComplexity,
      isBookmarked: bookmarkSet.has(p.id),
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      total: sanitized.length,
      problems: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
