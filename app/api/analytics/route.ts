import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized } from "@/lib/db";
import { getHistoricalAnalytics } from "@/lib/analytics/historical-analytics";

export async function GET() {
  try {
    await ensureDbInitialized();
    const analytics = await getHistoricalAnalytics();
    return NextResponse.json({ analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
