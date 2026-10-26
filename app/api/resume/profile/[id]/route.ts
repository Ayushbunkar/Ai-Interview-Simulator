import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { resumeProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    const [profile] = await db
      .select()
      .from(resumeProfiles)
      .where(eq(resumeProfiles.id, params.id));

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        extractedSkills: JSON.parse(profile.extractedSkills || "[]"),
        extractedProjects: JSON.parse(profile.extractedProjects || "[]"),
        extractedTechnologies: JSON.parse(profile.extractedTechnologies || "[]"),
        extractedTopics: JSON.parse(profile.extractedTopics || "[]"),
        jobRequirements: JSON.parse(profile.jobRequirements || "[]"),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDbInitialized();
    await db.delete(resumeProfiles).where(eq(resumeProfiles.id, params.id));
    return NextResponse.json({ success: true, message: "Resume profile deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
