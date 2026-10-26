import { CandidateProfileStructured } from "../types";

export interface ATSAnalysisResult {
  overallScore: number; // 0 - 100
  rating: "Excellent" | "Good Match" | "Average" | "Needs Optimization";
  breakdown: {
    skillsKeywordScore: number; // out of 30
    actionImpactScore: number; // out of 25
    experienceDepthScore: number; // out of 25
    formattingStructureScore: number; // out of 20
  };
  strengths: string[];
  improvements: string[];
  criticalMissingKeywords: string[];
  detectedSections: {
    hasContactInfo: boolean;
    hasSkillsSection: boolean;
    hasProjectsSection: boolean;
    hasExperienceSection: boolean;
    hasEducationSection: boolean;
  };
  quantifiedMetricsCount: number;
  wordCount: number;
}

const ACTION_VERBS = [
  "architected",
  "engineered",
  "developed",
  "designed",
  "implemented",
  "optimized",
  "built",
  "scaled",
  "spearheaded",
  "reduced",
  "improved",
  "integrated",
  "deployed",
  "automated",
  "maintained",
  "refactored",
  "orchestrated",
  "created",
  "configured",
  "migrated",
];

const ROLE_KEYWORD_BENCHMARKS: Record<string, string[]> = {
  java: ["java", "spring", "spring boot", "jvm", "sql", "rest", "hibernate", "microservices", "multithreading", "maven", "docker"],
  backend: ["rest", "api", "sql", "postgresql", "mysql", "redis", "docker", "microservices", "authentication", "git", "ci/cd"],
  frontend: ["react", "javascript", "typescript", "html", "css", "tailwind", "next.js", "redux", "state management", "responsive", "jest"],
  fullstack: ["react", "node.js", "javascript", "typescript", "mongodb", "postgresql", "rest", "docker", "git", "express", "tailwind"],
  python: ["python", "fastapi", "django", "flask", "sql", "pandas", "numpy", "docker", "git", "rest", "asyncio"],
  aiml: ["python", "machine learning", "deep learning", "pytorch", "tensorflow", "nlp", "rag", "langchain", "embeddings", "vector", "llm"],
  general: ["git", "data structures", "algorithms", "rest", "sql", "oop", "testing", "problem solving", "docker", "agile"],
};

/**
 * Calculates a rigorous, transparent Applicant Tracking System (ATS) score
 * with clear breakdown, keyword matching, metric density, and actionable suggestions.
 */
export function calculateATSScore(params: {
  rawResumeText: string;
  profile: CandidateProfileStructured;
  targetRole?: string;
  jobDescription?: string;
}): ATSAnalysisResult {
  const { rawResumeText, profile, targetRole = "", jobDescription = "" } = params;
  const lowerText = rawResumeText.toLowerCase();
  const words = rawResumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const strengths: string[] = [];
  const improvements: string[] = [];

  // 1. FORMATTING & STRUCTURE SCORE (0 - 20 pts)
  let formattingScore = 0;
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(rawResumeText);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(rawResumeText);
  const hasLinks = /(?:github\.com|linkedin\.com|gitlab\.com)/i.test(rawResumeText);
  const hasContactInfo = hasEmail || hasPhone || hasLinks;

  if (hasContactInfo) formattingScore += 5;
  else improvements.push("Add clear contact details (email, phone, LinkedIn/GitHub profile link).");

  const hasSkillsSection = /(?:skills|technologies|technical stack|tools|competencies)/i.test(rawResumeText);
  if (hasSkillsSection) formattingScore += 4;
  else improvements.push("Use a standard 'Technical Skills' section heading for automated ATS crawlers.");

  const hasProjectsSection = /(?:projects|academic projects|personal projects|key implementations)/i.test(rawResumeText);
  if (hasProjectsSection) formattingScore += 4;
  else improvements.push("Include a dedicated 'Projects' section highlighting tech stacks and architecture.");

  const hasExperienceSection = /(?:experience|employment|work history|internship|professional)/i.test(rawResumeText);
  if (hasExperienceSection) formattingScore += 4;

  const hasEducationSection = /(?:education|degree|bachelor|master|b\.tech|university|college|gpa)/i.test(rawResumeText);
  if (hasEducationSection) formattingScore += 3;

  // Length check: Ideal 250 - 900 words
  if (wordCount >= 200 && wordCount <= 900) {
    strengths.push(`Ideal document length (${wordCount} words) suitable for single/double-page ATS parsing.`);
  } else if (wordCount < 200) {
    improvements.push(`Resume is relatively brief (${wordCount} words). Expand on technical responsibilities and architectures.`);
  }

  // 2. SKILLS & KEYWORD MATCH SCORE (0 - 30 pts)
  let skillsScore = 0;
  const allSkills = [
    ...profile.skills.programmingLanguages,
    ...profile.skills.frontend,
    ...profile.skills.backend,
    ...profile.skills.databases,
    ...profile.skills.aiMl,
    ...profile.skills.devops,
    ...profile.skills.testing,
  ];

  // Base skill count points (max 15 pts)
  const uniqueSkillCount = new Set(allSkills.map(s => s.toLowerCase())).size;
  const skillCountPts = Math.min(15, uniqueSkillCount * 2);
  skillsScore += skillCountPts;

  // Role Benchmark Match (max 15 pts)
  const roleLower = targetRole.toLowerCase();
  let benchmarkCategory = "general";
  if (roleLower.includes("java")) benchmarkCategory = "java";
  else if (roleLower.includes("frontend") || roleLower.includes("react")) benchmarkCategory = "frontend";
  else if (roleLower.includes("full") || roleLower.includes("mern")) benchmarkCategory = "fullstack";
  else if (roleLower.includes("ai") || roleLower.includes("ml") || roleLower.includes("data")) benchmarkCategory = "aiml";
  else if (roleLower.includes("python")) benchmarkCategory = "python";
  else if (roleLower.includes("backend")) benchmarkCategory = "backend";

  const targetKeywords = ROLE_KEYWORD_BENCHMARKS[benchmarkCategory] || ROLE_KEYWORD_BENCHMARKS.general;
  const criticalMissingKeywords: string[] = [];

  let matchedBenchmarks = 0;
  for (const kw of targetKeywords) {
    const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (kwRegex.test(rawResumeText)) {
      matchedBenchmarks++;
    } else {
      criticalMissingKeywords.push(kw.toUpperCase());
    }
  }

  const roleMatchPts = Math.round((matchedBenchmarks / targetKeywords.length) * 15);
  skillsScore += roleMatchPts;

  if (uniqueSkillCount >= 6) {
    strengths.push(`Extracted ${uniqueSkillCount} verified technical competencies across languages, frameworks, and databases.`);
  } else {
    improvements.push("Add more explicit keywords for tools, testing frameworks (e.g. JUnit, Jest), and version control (Git).");
  }

  // 3. ACTION VERBS & MEASURABLE IMPACT (0 - 25 pts)
  let actionImpactScore = 0;

  // Action verbs check (max 12 pts)
  let foundActionVerbsCount = 0;
  for (const verb of ACTION_VERBS) {
    if (new RegExp(`\\b${verb}\\b`, "i").test(rawResumeText)) {
      foundActionVerbsCount++;
    }
  }
  const actionVerbPts = Math.min(12, foundActionVerbsCount * 2);
  actionImpactScore += actionVerbPts;

  if (foundActionVerbsCount >= 4) {
    strengths.push(`Strong active phrasing: found ${foundActionVerbsCount} engineering action verbs.`);
  } else {
    improvements.push("Start project bullet points with strong action verbs (e.g. 'Architected', 'Optimized', 'Integrated').");
  }

  // Quantified metrics check (max 13 pts)
  // looks for %, ms, x, k, MB, users, queries/sec, etc.
  const metricRegex = /(?:\d+%\s*|\d+x\s*|\d+ms\s*|\d+k\s*|\d+\s*(?:users|requests|queries|seconds|minutes|orders|records|rps|tps))/gi;
  const metricMatches = rawResumeText.match(metricRegex) || [];
  const quantifiedMetricsCount = metricMatches.length;

  const metricPts = Math.min(13, quantifiedMetricsCount * 4);
  actionImpactScore += metricPts;

  if (quantifiedMetricsCount >= 2) {
    strengths.push(`Quantified technical impact: found ${quantifiedMetricsCount} metrics (percentages, speedups, scale data).`);
  } else {
    improvements.push("Quantify project outcomes with numbers (e.g., 'reduced API response time by 40%', 'handled 5k daily requests').");
  }

  // 4. EXPERIENCE & PROJECT DEPTH (0 - 25 pts)
  let experienceDepthScore = 0;

  if (profile.projects.length >= 2) {
    experienceDepthScore += 12;
    strengths.push(`Demonstrated practical engineering through ${profile.projects.length} distinct project implementations.`);
  } else if (profile.projects.length === 1) {
    experienceDepthScore += 8;
  } else {
    improvements.push("Add at least 2 detailed technical projects with architecture, tools used, and personal ownership.");
  }

  const hasExperienceOrInternships = profile.experience.length > 0 || profile.internships.length > 0;
  if (hasExperienceOrInternships) {
    experienceDepthScore += 13;
    strengths.push("Professional experience or internship history clearly verified.");
  } else {
    // For freshers, good project descriptions compensate
    if (profile.projects.length >= 2 && quantifiedMetricsCount > 0) {
      experienceDepthScore += 10;
    } else {
      experienceDepthScore += 6;
      improvements.push("Include open-source contributions, internships, or academic project ownership to showcase teamwork.");
    }
  }

  // Calculate Overall Normalized Score (0 - 100)
  const totalScore = Math.min(100, Math.max(10, formattingScore + skillsScore + actionImpactScore + experienceDepthScore));

  let rating: "Excellent" | "Good Match" | "Average" | "Needs Optimization" = "Needs Optimization";
  if (totalScore >= 85) rating = "Excellent";
  else if (totalScore >= 70) rating = "Good Match";
  else if (totalScore >= 55) rating = "Average";

  return {
    overallScore: totalScore,
    rating,
    breakdown: {
      skillsKeywordScore: skillsScore,
      actionImpactScore,
      experienceDepthScore,
      formattingStructureScore: formattingScore,
    },
    strengths,
    improvements: improvements.slice(0, 4),
    criticalMissingKeywords: criticalMissingKeywords.slice(0, 6),
    detectedSections: {
      hasContactInfo,
      hasSkillsSection,
      hasProjectsSection,
      hasExperienceSection,
      hasEducationSection,
    },
    quantifiedMetricsCount,
    wordCount,
  };
}
