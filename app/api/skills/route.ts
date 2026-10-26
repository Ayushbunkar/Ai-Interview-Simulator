import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { getPersistentSkills } from "@/lib/assessment/revision-engine";

export async function GET() {
  try {
    await ensureDbInitialized();
    const skills = await getPersistentSkills();
    return NextResponse.json({ skills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
