import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { questions, bookmarks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const [q] = await db.select().from(questions).where(eq(questions.id, params.id));

    if (!q) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const [bm] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.itemType, "question"), eq(bookmarks.itemId, q.id)));

    return NextResponse.json({
      question: {
        id: q.id,
        category: q.category,
        topic: q.topic,
        difficulty: q.difficulty,
        companyTags: JSON.parse(q.companyTags || "[]"),
        questionText: q.questionText,
        expectedAnswer: q.expectedAnswer,
        explanation: q.explanation,
        followUps: JSON.parse(q.followUps || "[]"),
        isBookmarked: Boolean(bm),
        createdAt: q.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
