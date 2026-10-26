import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/interview/engine";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, interviewReports } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CreateInterviewSchema = z.object({
  title: z.string().nullable().optional(),
  targetRole: z.string().min(1, "Target role is required").default("Junior Developer"),
  companyProfile: z.enum([
    "TCS",
    "Capgemini",
    "Service-Based General",
    "Product-Based Engineering",
    "Startup Fast-Paced",
    "General Software Engineering",
    "Java / Backend Specialist",
    "AI / ML & GenAI",
    "Custom / General",
  ]).default("TCS"),
  difficulty: z.enum(["fresher", "entry_level", "intermediate", "experienced"]).default("fresher"),
  mode: z.enum(["strict", "practice", "realistic", "pressure"]).default("strict"),
  interviewModeVariant: z
    .enum([
      "full_mock",
      "technical_fundamentals",
      "advanced_technical",
      "coding_interview",
      "behavioral_hr",
      "voice_practice",
      "communication_practice",
      "pressure_interview",
      "revision_interview",
    ])
    .nullable()
    .optional()
    .default("full_mock"),
  resumeProfileId: z.string().nullable().optional(),
  primaryLanguage: z.enum(["java", "python", "cpp"]).nullable().optional().default("java"),
  durationMinutes: z.coerce.number().min(5).max(180).default(45),
  topicsEmphasized: z.array(z.string()).nullable().optional().default([]),
  resumeText: z.string().nullable().optional(),
  jobDescription: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await request.json();
    const validated = CreateInterviewSchema.parse(body);

    const session = await createSession({
      ...validated,
      title: validated.title || undefined,
      interviewModeVariant: validated.interviewModeVariant || "full_mock",
      resumeProfileId: validated.resumeProfileId || undefined,
      primaryLanguage: validated.primaryLanguage || "java",
      topicsEmphasized: validated.topicsEmphasized || [],
      resumeText: validated.resumeText || undefined,
      jobDescription: validated.jobDescription || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/interviews error:", error);
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
      return NextResponse.json({ error: messages || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create interview session" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureDbInitialized();
    const sessions = await db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt))
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
