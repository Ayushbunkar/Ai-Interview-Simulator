import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";

export async function POST() {
  try {
    const ai = getAIProvider();
    const result = await ai.testConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to connect to AI provider.",
      },
      { status: 500 }
    );
  }
}
