import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, ensureDbInitialized } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const BookmarkSchema = z.object({
  itemType: z.enum(["question", "problem"]),
  itemId: z.string().min(1),
});

export async function GET() {
  try {
    await ensureDbInitialized();
    const all = await db.select().from(bookmarks);
    return NextResponse.json({ bookmarks: all });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const validated = BookmarkSchema.parse(body);

    const existing = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.itemType, validated.itemType),
          eq(bookmarks.itemId, validated.itemId)
        )
      );

    if (existing.length > 0) {
      // Toggle off: remove
      await db
        .delete(bookmarks)
        .where(
          and(
            eq(bookmarks.itemType, validated.itemType),
            eq(bookmarks.itemId, validated.itemId)
          )
        );
      return NextResponse.json({ isBookmarked: false });
    } else {
      // Toggle on: add
      await db.insert(bookmarks).values({
        id: "bm-" + Math.random().toString(36).substring(2, 10),
        itemType: validated.itemType,
        itemId: validated.itemId,
        createdAt: new Date(),
      });
      return NextResponse.json({ isBookmarked: true });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
