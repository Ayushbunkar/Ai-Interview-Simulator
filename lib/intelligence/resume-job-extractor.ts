import { ExtractedProject, ResumeProfileData } from "../types";

// Common technical skills and keywords to match explicitly without inventing claims
const KNOWN_TECH_KEYWORDS = [
  "Java", "Spring Boot", "Spring", "Hibernate", "JPA", "Microservices",
  "Python", "Django", "FastAPI", "Flask", "C++", "C#", ".NET",
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "RabbitMQ", "SQLite",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git",
  "REST API", "GraphQL", "gRPC", "WebSockets", "OAuth2", "JWT",
  "SQL", "NoSQL", "DSA", "OOP", "System Design", "Multithreading",
  "Unit Testing", "JUnit", "Mockito", "PyTest", "Jest"
];

/**
 * Parses raw resume and job description text to extract verified candidate entities.
 * CRITICAL RULE: Never invent claims or assume candidate implemented something without explicit evidence.
 */
export function extractResumeIntelligence(params: {
  rawResumeText: string;
  rawJobDescription?: string;
  targetRole?: string;
  experienceLevel?: string;
}): {
  skills: string[];
  projects: ExtractedProject[];
  technologies: string[];
  topics: string[];
  jobRequirements: string[];
} {
  const resumeText = params.rawResumeText || "";
  const jobText = params.rawJobDescription || "";

  // 1. Extract explicitly mentioned technologies & skills
  const lowerResume = resumeText.toLowerCase();
  const matchedTech = KNOWN_TECH_KEYWORDS.filter(tech => {
    // Exact word boundary matching to avoid substring false positives
    const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return regex.test(resumeText);
  });

  // 2. Extract explicitly mentioned projects
  const projects: ExtractedProject[] = [];
  const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
  let inProjectSection = false;
  let currentProject: { name: string; lines: string[] } | null = null;
  const projectCandidates: { name: string; lines: string[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isSectionHeader = /^(projects?|key projects?|selected projects?|academic projects?):?$/i.test(line);
    const isNextSection = /^(skills|education|certifications|experience|achievements|languages):?$/i.test(line);

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

  for (const candidate of projectCandidates) {
    const blockText = candidate.name + "\n" + candidate.lines.join("\n");
    const projectTech = matchedTech.filter(tech => {
      const reg = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return reg.test(blockText);
    });

    const responsibilities = candidate.lines
      .filter(l => /^(developed|built|implemented|designed|created|engineered|integrated|deployed|maintained|optimized|tested|managed|utilized)/i.test(l.replace(/^[-*•\d.)\s]+/, "")))
      .map(l => l.replace(/^[-*•\d.)\s]+/, ""));

    let architecture: string | undefined;
    const archMatch = blockText.match(/(?:architecture|pattern|design):\s*([^\n.]+)/i);
    if (archMatch) architecture = archMatch[1].trim();

    let tradeOffs: string | undefined;
    const tradeMatch = blockText.match(/(?:trade-?offs?|decision|chose .* because):\s*([^\n.]+)/i);
    if (tradeMatch) tradeOffs = tradeMatch[1].trim();

    let claimedImpact: string | undefined;
    const impactMatch = blockText.match(/(?:improved|reduced|increased|scaled|handled)\s+[\w\s%+-]+(?:\d+[%kKmM]?)/i);
    if (impactMatch) claimedImpact = impactMatch[0].trim();

    projects.push({
      name: candidate.name,
      technologies: projectTech,
      responsibilities: responsibilities.length > 0 ? responsibilities : candidate.lines.slice(0, 2),
      architecture,
      tradeOffs,
      claimedImpact,
    });
  }

  // 3. Extract topics (OOP, Multithreading, DSA, APIs, SQL, System Design)
  const topics: string[] = [];
  if (lowerResume.includes("oop") || lowerResume.includes("object-oriented")) topics.push("Object-Oriented Programming");
  if (lowerResume.includes("rest") || lowerResume.includes("api")) topics.push("REST APIs & Microservices");
  if (lowerResume.includes("sql") || lowerResume.includes("database") || lowerResume.includes("dbms")) topics.push("Database & SQL Queries");
  if (lowerResume.includes("dsa") || lowerResume.includes("algorithm") || lowerResume.includes("data structure")) topics.push("DSA & Algorithmic Complexity");
  if (lowerResume.includes("concurrency") || lowerResume.includes("multithreading") || lowerResume.includes("thread")) topics.push("Concurrency & Multithreading");
  if (lowerResume.includes("docker") || lowerResume.includes("kubernetes") || lowerResume.includes("cloud")) topics.push("Cloud & Containerization");

  // 4. Extract job description requirements if provided
  const jobRequirements: string[] = [];
  if (jobText.trim().length > 0) {
    const jobMatched = KNOWN_TECH_KEYWORDS.filter(tech => {
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return regex.test(jobText);
    });
    jobRequirements.push(...jobMatched);
  }

  return {
    skills: matchedTech,
    projects: projects.slice(0, 5), // Cap at top 5 parsed projects
    technologies: matchedTech,
    topics,
    jobRequirements,
  };
}

/**
 * Generates progressively deeper project discussion questions based ONLY on verified candidate projects.
 * Adheres strictly to the requirement: Never invent claims.
 */
export function generateProgressiveProjectQuestions(project: ExtractedProject): {
  architectureQuestion: string;
  tradeOffQuestion: string;
  reliabilityAndFailureQuestion: string;
} {
  const techList = project.technologies.join(", ") || "the chosen technology stack";

  return {
    architectureQuestion: `In your project "${project.name}", what was the overall system architecture, and what was your specific personal contribution to its implementation?`,
    tradeOffQuestion: `You mentioned utilizing ${techList} in "${project.name}". What architectural or engineering trade-offs did you evaluate, and why was this stack chosen over alternatives?`,
    reliabilityAndFailureQuestion: `How did you test and validate the reliability of "${project.name}" under edge cases or load? What was the most significant technical challenge or failure you encountered, and how would you redesign it today?`,
  };
}
