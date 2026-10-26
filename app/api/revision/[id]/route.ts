import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { revisionQueue } from "@/lib/db/schema";
import { recordRevisionAttempt } from "@/lib/assessment/revision-engine";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const [item] = await db.select().from(revisionQueue).where(eq(revisionQueue.id, params.id));
    if (!item) {
      return NextResponse.json({ error: "Revision item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const { candidateResponse, score, feedback } = body;

    await recordRevisionAttempt({
      revisionItemId: params.id,
      candidateResponse: candidateResponse || "",
      score: Number(score ?? 75),
      feedback: feedback || "Completed revision drill.",
    });

    return NextResponse.json({ success: true, message: "Attempt recorded." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
