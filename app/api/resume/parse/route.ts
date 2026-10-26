import { NextRequest, NextResponse } from "next/server";
import { ensureDbInitialized, db } from "@/lib/db";
import { resumeProfiles } from "@/lib/db/schema";
import { extractTextFromDocument, parseResumeStructured } from "@/lib/intelligence/resume-parser";
import { calculateATSScore } from "@/lib/intelligence/ats-calculator";

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();

    const contentType = req.headers.get("content-type") || "";

    let rawResumeText = "";
    let rawJobDescription = "";
    let targetRole = "Software Engineer";
    let experienceLevel = "fresher";
    let candidateName = "Candidate";
    let isScanned = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      rawJobDescription = (formData.get("rawJobDescription") as string) || "";
      targetRole = (formData.get("targetRole") as string) || targetRole;
      experienceLevel = (formData.get("experienceLevel") as string) || experienceLevel;
      candidateName = (formData.get("candidateName") as string) || candidateName;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const extracted = await extractTextFromDocument({
          buffer,
          fileName: file.name,
          mimeType: file.type,
        });

        if (extracted.isScannedPdf) {
          return NextResponse.json(
            {
              error:
                "The uploaded document appears to be a scanned image or empty file without selectable text. Please upload a digital PDF, a DOCX file, or paste your resume text.",
              isScannedPdf: true,
            },
            { status: 400 }
          );
        }

        rawResumeText = extracted.text;
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

    if (!rawResumeText || rawResumeText.trim().length < 15) {
      return NextResponse.json(
        {
          error:
            "Resume content contains insufficient text. Please upload a valid document or paste your resume summary.",
        },
        { status: 400 }
      );
    }

    // Parse into validated structured schema with zero fabrication
    const parseResult = parseResumeStructured(rawResumeText);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error || "Failed to extract candidate entities from resume." },
        { status: 400 }
      );
    }

    const profileId = "prof-" + Math.random().toString(36).substring(2, 10);
    const now = new Date();

    const flattenedSkills = [
      ...parseResult.profile.skills.programmingLanguages,
      ...parseResult.profile.skills.frontend,
      ...parseResult.profile.skills.backend,
      ...parseResult.profile.skills.databases,
      ...parseResult.profile.skills.aiMl,
      ...parseResult.profile.skills.devops,
      ...parseResult.profile.skills.testing,
    ];

    await db.insert(resumeProfiles).values({
      id: profileId,
      candidateName: parseResult.profile.name || candidateName,
      targetRole,
      experienceLevel,
      rawResumeText,
      rawJobDescription,
      extractedSkills: JSON.stringify(flattenedSkills),
      extractedProjects: JSON.stringify(parseResult.profile.projects),
      extractedTechnologies: JSON.stringify(flattenedSkills),
      extractedTopics: JSON.stringify(flattenedSkills.slice(0, 8)),
      jobRequirements: JSON.stringify([]),
      createdAt: now,
      updatedAt: now,
    });

    const atsAnalysis = calculateATSScore({
      rawResumeText,
      profile: parseResult.profile,
      targetRole,
      jobDescription: rawJobDescription,
    });

    return NextResponse.json({
      success: true,
      profileId,
      profile: parseResult.profile,
      skillClassifications: parseResult.skillClassifications,
      rawResumeText,
      detectedStack: flattenedSkills.slice(0, 6),
      atsAnalysis,
    });
  } catch (error: any) {
    console.error("Resume parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume document." },
      { status: 500 }
    );
  }
}
