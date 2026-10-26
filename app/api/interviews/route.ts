import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/interview/engine";
import { db, ensureDbInitialized } from "@/lib/db";
import { interviewSessions, interviewReports } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CreateInterviewSchema = z.object({
  title: z.string().optional(),
  targetRole: z.string().min(2, "Target role is required"),
  companyProfile: z.enum([
    "TCS",
    "Capgemini",
    "Service-Based General",
    "Product-Based Engineering",
    "Java / Backend Specialist",
    "AI / ML & GenAI",
    "Custom / General",
  ]),
  difficulty: z.enum(["fresher", "entry_level", "intermediate", "experienced"]),
  mode: z.enum(["strict", "practice"]),
  primaryLanguage: z.enum(["java", "python", "cpp"]).default("java"),
  durationMinutes: z.number().min(15).max(180).default(60),
  topicsEmphasized: z.array(z.string()).optional(),
  resumeText: z.string().max(10000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateInterviewSchema.parse(body);

    const session = await createSession(validated);

    return NextResponse.json(
      {
        success: true,
        session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
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
