import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { getAPIUsageSummary } from "@/lib/ai/usage-tracker";

export async function GET() {
  try {
    await ensureDbInitialized();
    const summary = await getAPIUsageSummary();
    return NextResponse.json({ summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
