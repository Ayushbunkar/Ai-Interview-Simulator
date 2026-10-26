import {
  CandidateProfileStructured,
  InterviewBlueprint,
  ResumeClaimItem,
} from "../types";
import { db, ensureDbInitialized } from "../db";
import { interviewBlueprints, interviewSessions } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Built-in technology-specific progression interview trees.
 * Used dynamically whenever the candidate's resume includes that technology.
 */
export const TECH_INTERVIEW_TREES: Record<string, string[]> = {
  React: [
    "What is the difference between props and state in React, and when would changing state cause a component to re-render?",
    "What problems can occur if a useEffect dependency is omitted or incorrectly specified in React?",
    "How does React's reconciliation algorithm work with keys, and how would you investigate and prevent unnecessary re-renders in a large application?",
    "Tell me how you structured React component state, custom hooks, or context in the project described in your resume.",
  ],
  "Next.js": [
    "What are the core differences between Server Components and Client Components in Next.js App Router, and when should you use each?",
    "How does data caching, revalidation (ISR), and route handlers work in Next.js?",
    "How do you handle authentication, SEO optimization, and streaming with Suspense in Next.js?",
    "Describe your deployment strategy and performance optimizations in your Next.js project.",
  ],
  "Node.js": [
    "How does the Node.js event loop work across its distinct phases (timers, I/O callbacks, poll, check), and how do microtasks (process.nextTick, Promise) execute?",
    "How do you handle asynchronous error handling, uncaught rejections, and stream backpressure in Node.js?",
    "How do you structure Express middleware, request validation, authentication (JWT), and authorization in a production REST API?",
    "How did you manage database connection pooling and asynchronous throughput in your Node.js backend project?",
  ],
  MongoDB: [
    "What are the main trade-offs between embedding documents versus referencing documents in MongoDB schema design?",
    "How do compound indexes work in MongoDB, and how do you use the explain() plan to optimize query execution and avoid COLLSCAN?",
    "How do aggregation pipeline stages ($match, $group, $lookup, $unwind) operate, and what memory constraints apply to them?",
    "How did you structure collections, transactions, and consistency in the MongoDB project cited on your resume?",
  ],
  TypeScript: [
    "What are the practical differences between type aliases and interfaces in TypeScript, and how do generics enforce compile-time safety?",
    "How do conditional types, mapped types, and utility types (Pick, Omit, Partial, Record) work in advanced TypeScript codebases?",
    "How does TypeScript's type narrowing and discrimination union pattern prevent runtime errors when consuming external API payloads?",
  ],
  Python: [
    "How does Python manage memory internally (reference counting vs cyclic garbage collection), and how does the GIL affect multithreading?",
    "What are generators and decorators in Python, and how do they optimize memory when processing large datasets?",
    "How do you profile, structure, and package Python backend or data applications for production?",
  ],
  "AI / RAG / LangChain": [
    "In your AI project, what chunking strategy and embedding model did you choose, and why?",
    "How does vector similarity search work, and how do you mitigate hallucination or context window limits in a Retrieval-Augmented Generation (RAG) pipeline?",
    "How did you evaluate the accuracy, latency, and token cost of your AI model responses in production?",
  ],
  Java: [
    "What is the difference between method overloading and method overriding in Java, and how does the JVM handle dynamic method dispatch?",
    "How does the JVM garbage collector work (Eden, Survivor, Tenured), and how do you diagnose OutOfMemoryError and memory leaks?",
    "How do Java memory model semantics (volatile, synchronized, ReentrantLock) guarantee thread safety under high concurrency?",
  ],
  "Spring Boot": [
    "How does Spring Boot auto-configuration and dependency injection work under the hood via the ApplicationContext?",
    "How do you manage database transactions using @Transactional, and how do you handle transactional propagation and rollbacks?",
    "How do you design, secure, and monitor production microservices using Spring Boot, Spring Security, and Actuator?",
  ],
  PostgreSQL: [
    "How do ACID guarantees work in PostgreSQL, and what are the trade-offs between Read Committed, Repeatable Read, and Serializable isolation levels?",
    "How do B-tree vs GIN indexes work in PostgreSQL, and how do you optimize complex queries with EXPLAIN ANALYZE?",
    "How did you handle database schema migrations, indexes, and connection pooling in your project?",
  ],
  Docker: [
    "How do Docker container namespaces and cgroups differ from virtual machine hypervisors?",
    "How do you write multi-stage Dockerfiles to minimize image footprint and improve build cache efficiency?",
  ],
};

/**
 * Automatically creates an internal interview blueprint from the candidate's extracted profile.
 * STRICT RULE: The candidate must NOT be required to manually select technologies present in their resume.
 */
export async function generateInterviewBlueprint(params: {
  sessionId: string;
  resumeProfileId?: string;
  profile: CandidateProfileStructured;
  targetRole?: string;
  companyProfile?: string;
  jobDescription?: string;
  jobRequirements?: string[];
}): Promise<InterviewBlueprint> {
  await ensureDbInitialized();
  const { sessionId, resumeProfileId, profile } = params;

  // 1. Calculate Priority Map using weighted signals
  const skillOccurrences: Record<string, number> = {};

  const allSkillsList: string[] = [
    ...profile.skills.programmingLanguages,
    ...profile.skills.frontend,
    ...profile.skills.backend,
    ...profile.skills.databases,
    ...profile.skills.aiMl,
    ...profile.skills.devops,
    ...profile.skills.testing,
  ];

  // Base listed weight = 2
  for (const s of allSkillsList) {
    skillOccurrences[s] = (skillOccurrences[s] || 0) + 2;
  }

  // Project weight = 5 (practical demonstration receives highest priority)
  const demonstratedProjectSkills: string[] = [];
  for (const p of profile.projects) {
    for (const t of p.technologies) {
      skillOccurrences[t] = (skillOccurrences[t] || 0) + 5;
      if (!demonstratedProjectSkills.includes(t)) demonstratedProjectSkills.push(t);
    }
  }

  // Work experience / internship weight = 6 (professional responsibility)
  for (const exp of [...profile.experience, ...profile.internships]) {
    for (const t of exp.technologiesUsed) {
      skillOccurrences[t] = (skillOccurrences[t] || 0) + 6;
      if (!demonstratedProjectSkills.includes(t)) demonstratedProjectSkills.push(t);
    }
  }

  // Job Description Overlap Boost: +8 priority for technologies overlapping with target role JD
  const jdText = (params.jobDescription || (params.jobRequirements || []).join(" ")).toLowerCase();
  const jobDescriptionOverlapSkills: string[] = [];
  if (jdText.length > 0) {
    for (const skill of allSkillsList) {
      if (jdText.includes(skill.toLowerCase())) {
        skillOccurrences[skill] = (skillOccurrences[skill] || 0) + 8;
        if (!jobDescriptionOverlapSkills.includes(skill)) {
          jobDescriptionOverlapSkills.push(skill);
        }
      }
    }
  }

  // Inferred Skills: skills logically accompanying the candidate's core stack
  const inferredSkills: string[] = [];
  if (allSkillsList.some(s => s.toLowerCase().includes("react") || s.toLowerCase().includes("next"))) {
    if (!allSkillsList.includes("JavaScript")) inferredSkills.push("JavaScript (DOM / ES6+)");
    if (!allSkillsList.includes("TypeScript")) inferredSkills.push("TypeScript Type Safety");
  }
  if (allSkillsList.some(s => s.toLowerCase().includes("spring") || s.toLowerCase().includes("java"))) {
    if (!allSkillsList.includes("JVM Internals")) inferredSkills.push("JVM Internals & GC");
    if (!allSkillsList.includes("REST APIs")) inferredSkills.push("REST API Architecture");
  }
  if (allSkillsList.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("fastapi"))) {
    if (!allSkillsList.includes("Python GIL")) inferredSkills.push("Python Concurrency & Memory");
  }

  const unverifiedClaims = profile.resumeClaims.map(c => c.claim);

  // Sort by priority weight
  const sortedSkills = Object.entries(skillOccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill);

  // Primary Stack: Top 3-4 technologies
  const primaryStack = sortedSkills.slice(0, 4);
  const secondarySkills = sortedSkills.slice(4, 10);

  // High Priority Topics: Derived from primary stack & major project implementations
  const highPriorityTopics: string[] = [];
  const mediumPriorityTopics: string[] = [];
  const supportingFundamentals: string[] = [];

  for (const tech of primaryStack) {
    if (TECH_INTERVIEW_TREES[tech]) {
      highPriorityTopics.push(`${tech} Core & Architecture`);
    } else {
      highPriorityTopics.push(`${tech} Fundamentals & Practice`);
    }
  }

  // Add project architecture as high-priority if projects exist
  if (profile.projects.length > 0) {
    highPriorityTopics.push(`Project Verification: ${profile.projects[0].name}`);
  }

  for (const tech of secondarySkills) {
    mediumPriorityTopics.push(`${tech} Integration & Usage`);
  }

  // Supporting fundamentals based on stack
  if (primaryStack.some(s => ["React", "Node.js", "JavaScript", "TypeScript"].includes(s))) {
    supportingFundamentals.push("JavaScript Asynchronous Runtime & Closures", "REST API & HTTP Protocols");
  }
  if (primaryStack.some(s => ["Java", "Spring Boot", "C++"].includes(s))) {
    supportingFundamentals.push("OOP Principles & Polymorphism", "Data Structures & Big-O Complexity");
  }
  if (primaryStack.some(s => ["Python", "LangChain", "RAG"].includes(s))) {
    supportingFundamentals.push("Python Data Structures & Memory", "Vector Embeddings & Retrieval");
  }
  if (supportingFundamentals.length === 0) {
    supportingFundamentals.push("Data Structures & Algorithmic Complexity", "System Design Fundamentals");
  }

  // Automatic Programming Language Selection for Round 3 (Coding)
  let primaryLanguage: "java" | "python" | "cpp" | "javascript" = "java";

  const languagesFound = profile.skills.programmingLanguages.map(l => l.toLowerCase());
  const hasJava = languagesFound.includes("java") || primaryStack.some(s => s.toLowerCase().includes("java") || s.toLowerCase().includes("spring"));
  const hasPython = languagesFound.includes("python") || primaryStack.some(s => s.toLowerCase().includes("python") || s.toLowerCase().includes("ai"));
  const hasCpp = languagesFound.includes("c++");

  if (hasJava) {
    primaryLanguage = "java";
  } else if (hasPython) {
    primaryLanguage = "python";
  } else if (hasCpp) {
    primaryLanguage = "cpp";
  } else if (languagesFound.includes("javascript") || languagesFound.includes("typescript")) {
    primaryLanguage = "python"; // Python is the most accessible scripting counterpart for LeetCode
  }

  // Planned distribution across rounds
  const plannedDistribution = {
    1: { topic: "Technical Fundamentals", focus: highPriorityTopics.slice(0, 2).join(", "), questionsCount: 4 },
    2: { topic: "Advanced CS & Projects", focus: `Deep dive into ${profile.projects.map(p => p.name).join(", ") || primaryStack.join(", ")}`, questionsCount: 4 },
    3: { topic: "Coding Room", focus: `Algorithmic problem solving in ${primaryLanguage.toUpperCase()}`, questionsCount: 1 },
    4: { topic: "Behavioral & HR", focus: "STAR framework on verified projects & career goals", questionsCount: 3 },
  };

  const blueprintId = "bp-" + Math.random().toString(36).substring(2, 10);
  const now = new Date();

  // Save blueprint to database if the session exists in DB
  try {
    const [existingSession] = await db
      .select({ id: interviewSessions.id })
      .from(interviewSessions)
      .where(eq(interviewSessions.id, sessionId));

    if (existingSession) {
      await db.insert(interviewBlueprints).values({
        id: blueprintId,
        sessionId,
        resumeProfileId: resumeProfileId || null,
        primaryStack: JSON.stringify(primaryStack),
        secondarySkills: JSON.stringify(secondarySkills),
        highPriorityTopics: JSON.stringify(highPriorityTopics),
        mediumPriorityTopics: JSON.stringify(mediumPriorityTopics),
        supportingFundamentals: JSON.stringify(supportingFundamentals),
        resumeClaims: JSON.stringify(profile.resumeClaims),
        primaryLanguage,
        plannedDistribution: JSON.stringify(plannedDistribution),
        rawBlueprintJson: JSON.stringify({
          candidateProfile: profile,
          trees: TECH_INTERVIEW_TREES,
          jobDescriptionOverlapSkills,
          explicitlyStatedSkills: allSkillsList,
          demonstratedProjectSkills,
          inferredSkills,
          unverifiedClaims,
        }),
        createdAt: now,
      });
    }
  } catch (err) {
    console.warn("Could not persist blueprint to database:", err);
  }

  return {
    id: blueprintId,
    sessionId,
    resumeProfileId,
    primaryStack,
    secondarySkills,
    highPriorityTopics,
    mediumPriorityTopics,
    supportingFundamentals,
    jobDescriptionOverlapSkills,
    explicitlyStatedSkills: allSkillsList,
    demonstratedProjectSkills,
    inferredSkills,
    unverifiedClaims,
    resumeClaims: profile.resumeClaims,
    primaryLanguage,
    plannedDistribution,
    technologyInterviewTrees: TECH_INTERVIEW_TREES,
  };
}

/**
 * Retrieves an existing blueprint for a session.
 */
export async function getBlueprintForSession(sessionId: string): Promise<InterviewBlueprint | null> {
  const [row] = await db
    .select()
    .from(interviewBlueprints)
    .where(eq(interviewBlueprints.sessionId, sessionId));

  if (!row) return null;

  return {
    id: row.id,
    sessionId: row.sessionId,
    resumeProfileId: row.resumeProfileId || undefined,
    primaryStack: JSON.parse(row.primaryStack || "[]"),
    secondarySkills: JSON.parse(row.secondarySkills || "[]"),
    highPriorityTopics: JSON.parse(row.highPriorityTopics || "[]"),
    mediumPriorityTopics: JSON.parse(row.mediumPriorityTopics || "[]"),
    supportingFundamentals: JSON.parse(row.supportingFundamentals || "[]"),
    resumeClaims: JSON.parse(row.resumeClaims || "[]"),
    primaryLanguage: row.primaryLanguage as any,
    plannedDistribution: JSON.parse(row.plannedDistribution || "{}"),
    technologyInterviewTrees: TECH_INTERVIEW_TREES,
  };
}
