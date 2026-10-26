import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { getRevisionQueueItems, markRevisionItemReviewed } from "@/lib/assessment/revision-engine";

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get("filter") as "due" | "all") || "all";
    const items = await getRevisionQueueItems(filter);

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { revisionItemId, action } = body;

    if (action === "mark_reviewed" && revisionItemId) {
      await markRevisionItemReviewed(revisionItemId);
      return NextResponse.json({ success: true, message: "Marked as reviewed." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
