import { NextRequest, NextResponse } from "next/server";
import { isLiveAIConfigured, getAIProvider } from "@/lib/ai";
import { getCompilerProvider } from "@/lib/compiler";
import { db, ensureDbInitialized } from "@/lib/db";
import { appSettings, interviewSessions, interviewReports, conversationMessages, candidateAnswers, codeSubmissions, executionResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();
    const compiler = getCompilerProvider();

    // Check safe status without exposing secret keys
    const groqKey = process.env.GROQ_API_KEY || "";
    const compilerKey = process.env.ONLINECOMPILER_API_KEY || "";

    const settingsRows = await db.select().from(appSettings);
    const settingsMap = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));

    return NextResponse.json({
      ai: {
        provider: "Groq",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        configured: Boolean(groqKey && groqKey.trim().length > 0),
        maskedKey: groqKey ? `${groqKey.substring(0, 4)}...${groqKey.substring(groqKey.length - 4)}` : null,
      },
      compiler: {
        provider: "OnlineCompiler.io",
        url: process.env.ONLINECOMPILER_API_URL || "https://api.onlinecompiler.io/api/judge0",
        configured: compiler.isConfigured(),
        maskedKey: compilerKey ? `${compilerKey.substring(0, 4)}...${compilerKey.substring(compilerKey.length - 4)}` : null,
      },
      preferences: {
        theme: settingsMap.theme || "dark",
        defaultLanguage: settingsMap.defaultLanguage || "java",
        defaultDuration: parseInt(settingsMap.defaultDuration || "60", 10),
        defaultDifficulty: settingsMap.defaultDifficulty || "fresher",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();

    const allowedKeys = ["theme", "defaultLanguage", "defaultDuration", "defaultDifficulty"];
    const now = new Date();

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await db
          .insert(appSettings)
          .values({
            id: `pref-${key}`,
            key,
            value: String(body[key]),
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: appSettings.key,
            set: {
              value: String(body[key]),
              updatedAt: now,
            },
          });
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const sessionId = searchParams.get("sessionId");

    if (action === "clear-all") {
      // Clear all interview records
      await db.delete(interviewReports);
      await db.delete(candidateAnswers);
      await db.delete(conversationMessages);
      await db.delete(executionResults);
      await db.delete(codeSubmissions);
      await db.delete(interviewSessions);
      return NextResponse.json({ success: true, message: "All interview history cleared." });
    }

    if (sessionId) {
      // Delete single session
      await db.delete(interviewReports).where(eq(interviewReports.sessionId, sessionId));
      await db.delete(candidateAnswers).where(eq(candidateAnswers.sessionId, sessionId));
      await db.delete(conversationMessages).where(eq(conversationMessages.sessionId, sessionId));
      await db.delete(codeSubmissions).where(eq(codeSubmissions.sessionId, sessionId));
      await db.delete(interviewSessions).where(eq(interviewSessions.id, sessionId));
      return NextResponse.json({ success: true, message: `Session ${sessionId} deleted.` });
    }

    return NextResponse.json({ error: "Invalid action or sessionId required." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
