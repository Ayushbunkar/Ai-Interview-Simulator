import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { resumeProfiles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    await ensureDbInitialized();
    const [recent] = await db
      .select()
      .from(resumeProfiles)
      .orderBy(desc(resumeProfiles.createdAt))
      .limit(1);

    if (!recent) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: {
        id: recent.id,
        candidateName: recent.candidateName,
        targetRole: recent.targetRole,
        experienceLevel: recent.experienceLevel,
        rawResumeText: recent.rawResumeText,
        extractedSkills: JSON.parse(recent.extractedSkills || "[]"),
        extractedProjects: JSON.parse(recent.extractedProjects || "[]"),
        createdAt: recent.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
