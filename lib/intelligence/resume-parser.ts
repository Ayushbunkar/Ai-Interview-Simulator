import {
  CandidateProfileStructured,
  CandidateEducation,
  CandidateWorkExperience,
  CandidateProjectRecord,
  StructuredResumeSkills,
  ResumeClaimItem,
  SkillSourceClassification,
} from "../types";

// Categorized comprehensive technical dictionary
export const TECHNICAL_SKILL_CATEGORIES = {
  programmingLanguages: [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Kotlin", "Swift", "C", "SQL"
  ],
  frontend: [
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Redux", "Tailwind CSS", "HTML5", "CSS3", "Bootstrap", "Webpack", "Vite"
  ],
  backend: [
    "Node.js", "Express.js", "Express", "Spring Boot", "Spring", "Django", "FastAPI", "Flask", "ASP.NET", ".NET Core", "NestJS", "Ruby on Rails", "REST API", "GraphQL", "gRPC", "Microservices"
  ],
  databases: [
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite", "Cassandra", "DynamoDB", "Elasticsearch", "Oracle", "Prisma", "Hibernate", "JPA"
  ],
  aiMl: [
    "LangChain", "RAG", "Vector search", "Embeddings", "PyTorch", "TensorFlow", "Scikit-learn", "OpenAI", "Hugging Face", "LLMs", "Pandas", "NumPy"
  ],
  devops: [
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "GitHub Actions", "Jenkins", "Terraform", "Linux", "Nginx"
  ],
  testing: [
    "Jest", "JUnit", "Mockito", "PyTest", "Cypress", "Selenium", "Postman"
  ],
  tools: [
    "Git", "GitHub", "GitLab", "Jira", "VS Code", "Postman", "Maven", "Gradle"
  ],
};

export interface ResumeParseResult {
  success: boolean;
  isScannedPdf?: boolean;
  error?: string;
  rawText: string;
  profile: CandidateProfileStructured;
  skillClassifications: SkillSourceClassification[];
}

/**
 * Extracts plain text from Buffer according to file type, with robust scanned PDF detection.
 */
/**
 * Extracts raw textual representation from uploaded document buffer with OCR fallback
 * for scanned PDFs, images (JPG, PNG, WEBP), and Word documents.
 */
async function runTesseractOcr(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length < 8) return "";

  // Check magic numbers for supported image formats
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isBmp = buffer[0] === 0x42 && buffer[1] === 0x4d;
  const isWebp = buffer.slice(8, 12).toString("ascii") === "WEBP";
  const isTiff = (buffer[0] === 0x49 && buffer[1] === 0x49) || (buffer[0] === 0x4d && buffer[1] === 0x4d);

  if (!isPng && !isJpg && !isBmp && !isWebp && !isTiff) {
    return "";
  }

  try {
    const tesseractModule = (await import("tesseract.js")) as any;
    const Tesseract = tesseractModule.default || tesseractModule;
    if (typeof Tesseract.recognize === "function") {
      const ocrPromise = Tesseract.recognize(buffer, "eng").catch((e: any) => {
        console.warn("Tesseract worker error:", e?.message);
        return null;
      });
      const timeoutPromise = new Promise<{ data: { text: string } } | null>((resolve) =>
        setTimeout(() => resolve(null), 20000)
      );
      const res = await Promise.race([ocrPromise, timeoutPromise]);
      if (res && res.data && typeof res.data.text === "string") {
        return res.data.text.trim();
      }
    }
  } catch (ocrErr) {
    console.warn("Tesseract OCR fallback warning:", ocrErr);
  }
  return "";
}

export async function extractTextFromDocument(params: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
}): Promise<{ text: string; isScannedPdf: boolean }> {
  const { buffer, fileName, mimeType } = params;
  const lowerName = fileName.toLowerCase();

  // 1. DOCX files
  if (lowerName.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const mammoth = (await import("mammoth")) as any;
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ? result.value.trim() : "";
      return { text, isScannedPdf: false };
    } catch (err: any) {
      throw new Error(`DOCX extraction failed: ${err.message}`);
    }
  }

  // 2. Images (JPG, JPEG, PNG, WEBP, BMP, etc.)
  const isImageFile =
    mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|bmp|tiff|tif)$/i.test(lowerName);

  if (isImageFile) {
    const ocrText = await runTesseractOcr(buffer);
    const cleanChars = ocrText.replace(/[^a-zA-Z0-9]/g, "");
    return {
      text: ocrText,
      isScannedPdf: cleanChars.length < 15,
    };
  }

  // 3. PDF files (Digital or Scanned)
  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    try {
      let extractedText = "";

      // Try pdf-parse v2 (PDFParse class)
      try {
        const pdfParseModule = (await import("pdf-parse")) as any;
        if (pdfParseModule.PDFParse) {
          const parser = new pdfParseModule.PDFParse({ data: buffer });
          const res = await parser.getText();
          if (res && typeof res.text === "string") {
            extractedText = res.text.trim();
          }
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        } else if (typeof pdfParseModule.default === "function") {
          const data = await pdfParseModule.default(buffer);
          extractedText = data.text ? data.text.trim() : "";
        } else if (typeof pdfParseModule === "function") {
          const data = await (pdfParseModule as any)(buffer);
          extractedText = data.text ? data.text.trim() : "";
        }
      } catch (pdfErr) {
        console.warn("PDF parser error:", pdfErr);
      }

      // If text extraction yielded content, return it
      const cleanChars = extractedText.replace(/[^a-zA-Z0-9]/g, "");
      if (cleanChars.length >= 25) {
        return { text: extractedText, isScannedPdf: false };
      }

      // Stream fallback: extract text streams from PDF buffer if standard parser missed it
      const bufferStr = buffer.toString("latin1");
      const streamMatches = bufferStr.match(/stream[\r\n]+([\s\S]*?)endstream/g);
      if (streamMatches) {
        let textCandidate = "";
        for (const s of streamMatches) {
          const tjMatches = s.match(/\((.*?)\)\s*Tj/g) || s.match(/\[(.*?)\]\s*TJ/g);
          if (tjMatches) {
            textCandidate += " " + tjMatches.map(m => m.replace(/[\(\)\[\]]|\s*T[jJ]/g, "")).join(" ");
          }
        }
        if (textCandidate.replace(/[^a-zA-Z0-9]/g, "").length >= 25) {
          return { text: textCandidate.trim(), isScannedPdf: false };
        }
      }

      // 4. OCR fallback for Scanned/Raster PDFs (extract embedded images & recognize)
      let ocrExtracted = "";
      try {
        const pdfParseModule = (await import("pdf-parse")) as any;
        if (pdfParseModule.PDFParse) {
          const imgParser = new pdfParseModule.PDFParse({ data: buffer });
          if (typeof imgParser.getImage === "function") {
            const imgRes = await imgParser.getImage({ imageBuffer: true });
            if (imgRes && Array.isArray(imgRes.pages)) {
              for (const page of imgRes.pages) {
                if (Array.isArray(page.images)) {
                  for (const img of page.images) {
                    if (img.data && img.data.length > 500) {
                      const t = await runTesseractOcr(Buffer.from(img.data));
                      if (t) {
                        ocrExtracted += "\n" + t;
                      }
                    }
                  }
                }
              }
            }
          }
          if (typeof imgParser.destroy === "function") {
            await imgParser.destroy();
          }
        }
      } catch (imgErr) {
        console.warn("PDF image extraction for OCR warning:", imgErr);
      }

      // Try OCR on buffer if embedded image extraction did not produce enough text
      if (ocrExtracted.replace(/[^a-zA-Z0-9]/g, "").length < 20) {
        const directOcr = await runTesseractOcr(buffer);
        if (directOcr) {
          ocrExtracted += "\n" + directOcr;
        }
      }

      const totalCandidate = (extractedText + "\n" + ocrExtracted).trim();
      const totalCleanChars = totalCandidate.replace(/[^a-zA-Z0-9]/g, "");

      if (totalCleanChars.length >= 15) {
        return { text: totalCandidate, isScannedPdf: false };
      }

      return { text: "", isScannedPdf: true };
    } catch (err: any) {
      console.warn("PDF extraction error:", err);
      return { text: "", isScannedPdf: true };
    }
  }

  // 5. Plain text or markdown
  return { text: buffer.toString("utf-8").trim(), isScannedPdf: false };
}

/**
 * Parses raw text into a strictly validated, non-fabricated candidate profile.
 * STRICT RULE: Never invent claims or assume proficiency without explicit textual evidence.
 */
export function parseResumeStructured(rawText: string): ResumeParseResult {
  if (!rawText || rawText.trim().length < 15) {
    return {
      success: false,
      isScannedPdf: true,
      error: "The uploaded resume content is empty or contains insufficient text.",
      rawText: "",
      profile: createEmptyProfile(),
      skillClassifications: [],
    };
  }

  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  const lowerText = rawText.toLowerCase();

  // Candidate Name extraction (usually top line)
  const candidateName = lines[0] && lines[0].length < 40 && !/^(resume|curriculum|cv|contact)/i.test(lines[0])
    ? lines[0].replace(/^[-*•#\s]+/, "")
    : "Candidate";

  // 1. Skill Extraction across all categories
  const skills: StructuredResumeSkills = {
    programmingLanguages: [],
    frontend: [],
    backend: [],
    databases: [],
    aiMl: [],
    devops: [],
    testing: [],
    tools: [],
    other: [],
  };

  const skillClassifications: SkillSourceClassification[] = [];

  for (const [category, techList] of Object.entries(TECHNICAL_SKILL_CATEGORIES)) {
    for (const tech of techList) {
      // Exact word boundary regex
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(rawText)) {
        (skills as any)[category].push(tech);

        // Determine source classification
        const projectRegex = new RegExp(`(?:projects?|experience)[\\s\\S]{1,500}\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        const isProjectDemonstrated = projectRegex.test(rawText);

        const expRegex = new RegExp(`(?:experience|internship|worked at)[\\s\\S]{1,500}\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        const isProfessional = expRegex.test(rawText);

        skillClassifications.push({
          name: tech,
          category,
          explicitlyListed: true,
          demonstratedThroughProjects: isProjectDemonstrated,
          usedProfessionally: isProfessional,
          mentionedBriefly: !isProjectDemonstrated && !isProfessional,
          inferred: false, // Inferred skills are NEVER treated as candidate claims
        });
      }
    }
  }

  // 2. Projects Extraction
  const projects: CandidateProjectRecord[] = [];
  let inProjectSection = false;
  let currentProject: { name: string; lines: string[] } | null = null;
  const projectCandidates: { name: string; lines: string[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isSectionHeader = /^(projects?|key projects?|selected projects?|academic projects?):?$/i.test(line);
    const isNextSection = /^(skills|education|certifications|experience|internships|achievements|languages):?$/i.test(line);

    if (isSectionHeader) {
      inProjectSection = true;
      continue;
    }
    if (inProjectSection && isNextSection) {
      inProjectSection = false;
      if (currentProject) projectCandidates.push(currentProject);
      currentProject = null;
      continue;
    }

    if (inProjectSection) {
      const isDescription =
        line.startsWith("-") ||
        line.startsWith("•") ||
        line.startsWith("*") ||
        /^(developed|built|implemented|designed|created|engineered|integrated|deployed|architecture:|trade-offs?:)/i.test(line);

      if (!isDescription && line.length >= 3 && line.length <= 60) {
        if (currentProject) projectCandidates.push(currentProject);
        currentProject = { name: line.replace(/[:\-]$/, "").trim(), lines: [] };
      } else if (currentProject) {
        currentProject.lines.push(line);
      }
    }
  }
  if (currentProject) projectCandidates.push(currentProject);

  for (const cand of projectCandidates) {
    const blockText = cand.name + "\n" + cand.lines.join("\n");

    // Match technologies inside this specific project
    const projectTech: string[] = [];
    for (const [_, list] of Object.entries(TECHNICAL_SKILL_CATEGORIES)) {
      for (const t of list) {
        const reg = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (reg.test(blockText) && !projectTech.includes(t)) {
          projectTech.push(t);
        }
      }
    }

    let architecture: string | undefined;
    const archMatch = blockText.match(/(?:architecture|pattern|design):\s*([^\n.]+)/i);
    if (archMatch) architecture = archMatch[1].trim();

    let tradeOffs: string | undefined;
    const tradeMatch = blockText.match(/(?:trade-?offs?|decision|chose .* because):\s*([^\n.]+)/i);
    if (tradeMatch) tradeOffs = tradeMatch[1].trim();

    const responsibilities = cand.lines
      .filter(l => /^(developed|built|implemented|designed|created|engineered|integrated|deployed|maintained|optimized|tested|managed|utilized)/i.test(l.replace(/^[-*•\d.)\s]+/, "")))
      .map(l => l.replace(/^[-*•\d.)\s]+/, ""));

    projects.push({
      name: cand.name,
      description: cand.lines.join(" "),
      technologies: projectTech,
      personalContribution: responsibilities.join("; ") || undefined,
      architecture,
      tradeOffs,
      sourceText: blockText,
    });
  }

  // 3. Work Experience & Internships Extraction
  const experience: CandidateWorkExperience[] = [];
  const internships: CandidateWorkExperience[] = [];
  let inExpSection = false;
  let inInternSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(work experience|professional experience|experience):?$/i.test(line)) {
      inExpSection = true;
      inInternSection = false;
      continue;
    }
    if (/^(internships?|summer internship):?$/i.test(line)) {
      inInternSection = true;
      inExpSection = false;
      continue;
    }
    if (/^(education|projects|skills|certifications):?$/i.test(line)) {
      inExpSection = false;
      inInternSection = false;
      continue;
    }

    if ((inExpSection || inInternSection) && line.length > 5 && !line.startsWith("-")) {
      const techInExp: string[] = [];
      for (const [_, list] of Object.entries(TECHNICAL_SKILL_CATEGORIES)) {
        for (const t of list) {
          if (new RegExp(`\\b${t}\\b`, "i").test(line)) techInExp.push(t);
        }
      }

      const record: CandidateWorkExperience = {
        company: line.split(/[-–|]/)[0].trim(),
        role: line.split(/[-–|]/)[1]?.trim() || "Software Engineer",
        responsibilities: [line],
        technologiesUsed: techInExp,
      };

      if (inInternSection) internships.push(record);
      else experience.push(record);
    }
  }

  // 4. Education
  const education: CandidateEducation[] = [];
  let inEduSection = false;
  for (const line of lines) {
    if (/^(education|academic background):?$/i.test(line)) {
      inEduSection = true;
      continue;
    }
    if (inEduSection && /^(experience|projects|skills|certifications):?$/i.test(line)) {
      inEduSection = false;
      continue;
    }
    if (inEduSection && (line.includes("Bachelor") || line.includes("B.Tech") || line.includes("Master") || line.includes("University") || line.includes("College") || line.includes("Institute"))) {
      education.push({
        institution: line,
        degree: line.includes("B.Tech") ? "B.Tech" : line.includes("Bachelor") ? "Bachelor's" : "Degree",
      });
    }
  }

  // 5. Explicit Technical Claims to Verify
  const resumeClaims: ResumeClaimItem[] = [];

  // Extract performance/scale claims
  const scaleMatches = Array.from(rawText.matchAll(/(?:reduced|improved|increased|handled|scaled|optimized)\s+[\w\s]{2,40}(?:\d+%|\d+k|\d+ms|\d+x)/gi));
  for (const m of scaleMatches) {
    resumeClaims.push({
      claim: m[0].trim(),
      sourceSection: "Project / Experience",
      supportingText: m[0].trim(),
      priority: "high",
    });
  }

  // Extract core technology claims
  for (const proj of projects) {
    if (proj.technologies.length > 0) {
      resumeClaims.push({
        claim: `Implemented ${proj.name} utilizing ${proj.technologies.join(", ")}`,
        sourceSection: "Projects",
        supportingText: proj.description.slice(0, 150),
        priority: "high",
      });
    }
  }

  return {
    success: true,
    isScannedPdf: false,
    rawText,
    profile: {
      name: candidateName,
      education,
      experience,
      internships,
      projects,
      skills,
      certifications: [],
      resumeClaims,
    },
    skillClassifications,
  };
}

function createEmptyProfile(): CandidateProfileStructured {
  return {
    education: [],
    experience: [],
    internships: [],
    projects: [],
    skills: {
      programmingLanguages: [],
      frontend: [],
      backend: [],
      databases: [],
      aiMl: [],
      devops: [],
      testing: [],
      tools: [],
      other: [],
    },
    certifications: [],
    resumeClaims: [],
  };
}
