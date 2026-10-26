import { NextRequest, NextResponse } from "next/server";
import { finishSession } from "@/lib/interview/engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await finishSession(params.id);
    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      overallScore: result.overallScore,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
