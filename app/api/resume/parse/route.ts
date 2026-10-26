import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { resumeProfiles } from "@/lib/db/schema";
import { extractResumeIntelligence } from "@/lib/intelligence/resume-job-extractor";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const contentType = req.headers.get("content-type") || "";

    let rawResumeText = "";
    let rawJobDescription = "";
    let targetRole = "Software Engineer";
    let experienceLevel = "fresher";
    let candidateName = "Candidate";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      rawJobDescription = (formData.get("rawJobDescription") as string) || "";
      targetRole = (formData.get("targetRole") as string) || targetRole;
      experienceLevel = (formData.get("experienceLevel") as string) || experienceLevel;
      candidateName = (formData.get("candidateName") as string) || candidateName;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          // Parse PDF via pdf-parse
          const pdfParseModule = (await import("pdf-parse")) as any;
          const pdfParse = pdfParseModule.default || pdfParseModule;
          const parsed = await pdfParse(buffer);
          rawResumeText = parsed.text || "";
        } else {
          // Plain text file
          rawResumeText = buffer.toString("utf-8");
        }
      } else {
        rawResumeText = (formData.get("rawResumeText") as string) || "";
      }
    } else {
      const body = await req.json();
      rawResumeText = body.rawResumeText || "";
      rawJobDescription = body.rawJobDescription || "";
      targetRole = body.targetRole || targetRole;
      experienceLevel = body.experienceLevel || experienceLevel;
      candidateName = body.candidateName || candidateName;
    }

    if (!rawResumeText.trim()) {
      return NextResponse.json(
        { error: "Resume text or document content is required." },
        { status: 400 }
      );
    }

    // Extract intelligence with strict non-fabrication guarantees
    const extracted = extractResumeIntelligence({
      rawResumeText,
      rawJobDescription,
      targetRole,
      experienceLevel,
    });

    const profileId = "prof-" + Math.random().toString(36).substring(2, 10);
    const now = new Date();

    await db.insert(resumeProfiles).values({
      id: profileId,
      candidateName,
      targetRole,
      experienceLevel,
      rawResumeText,
      rawJobDescription,
      extractedSkills: JSON.stringify(extracted.skills),
      extractedProjects: JSON.stringify(extracted.projects),
      extractedTechnologies: JSON.stringify(extracted.technologies),
      extractedTopics: JSON.stringify(extracted.topics),
      jobRequirements: JSON.stringify(extracted.jobRequirements),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      profileId,
      extracted,
      rawResumeText,
    });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume document." },
      { status: 500 }
    );
  }
}
