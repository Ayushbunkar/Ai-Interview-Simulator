import { NextResponse } from "next/server";
import { ensureDbInitialized, sqliteClient } from "@/lib/db";
import { isLiveAIConfigured } from "@/lib/ai";
import { getCompilerProvider } from "@/lib/compiler";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();
    const dbCheck = await sqliteClient.execute("SELECT count(*) as count FROM questions;");
    const compiler = getCompilerProvider();

    return NextResponse.json({
      status: "healthy",
      service: "InterviewForge AI",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        questionsCount: dbCheck.rows[0]?.count || 0,
      },
      ai: {
        configured: isLiveAIConfigured(),
        provider: isLiveAIConfigured() ? "Groq API (Configured)" : "Local Development Engine (Active)",
      },
      compiler: {
        configured: compiler.isConfigured(),
        provider: compiler.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
