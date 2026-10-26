import { SkillCategory, SkillScoreItem, SkillRadarAnalysis, CommunicationReport } from "../types";

interface AssessmentEvidenceInput {
  candidateAnswers: {
    roundNumber: number;
    questionText: string;
    answerText: string;
    evaluationScore: number | null;
    strengths?: string[];
    weaknesses?: string[];
  }[];
  codeSubmissions: {
    language: string;
    status: string;
    passedTests: number;
    totalTests: number;
    code: string;
  }[];
  communicationReport?: CommunicationReport;
}

const SKILL_DEFINITIONS: { skill: SkillCategory; label: string; keywords: string[]; rounds: number[] }[] = [
  {
    skill: "java_fundamentals",
    label: "Java & Programming Fundamentals",
    keywords: ["java", "jvm", "jdk", "jre", "collection", "exception", "garbage collection", "memory", "primitive", "string", "thread"],
    rounds: [1],
  },
  {
    skill: "oop",
    label: "Object-Oriented Programming (OOP)",
    keywords: ["polymorphism", "inheritance", "encapsulation", "abstraction", "interface", "abstract class", "override", "overload"],
    rounds: [1],
  },
  {
    skill: "dsa",
    label: "Data Structures & Core DSA",
    keywords: ["array", "linked list", "tree", "binary tree", "graph", "heap", "hash", "stack", "queue"],
    rounds: [1, 2, 3],
  },
  {
    skill: "algorithmic_reasoning",
    label: "Algorithmic Reasoning",
    keywords: ["two pointer", "sliding window", "binary search", "recursion", "dynamic programming", "greedy", "bfs", "dfs", "backtracking", "approach"],
    rounds: [2, 3],
  },
  {
    skill: "time_complexity",
    label: "Time Complexity Analysis",
    keywords: ["o(n)", "o(log n)", "o(n log n)", "o(1)", "o(n^2)", "big-o", "time complexity", "runtime"],
    rounds: [1, 2, 3],
  },
  {
    skill: "space_complexity",
    label: "Space Complexity Analysis",
    keywords: ["auxiliary space", "space complexity", "in-place", "memory overhead", "call stack"],
    rounds: [1, 2, 3],
  },
  {
    skill: "edge_case_analysis",
    label: "Edge-Case Analysis",
    keywords: ["null", "empty", "boundary", "overflow", "negative", "duplicates", "single element", "corner case"],
    rounds: [2, 3],
  },
  {
    skill: "code_correctness",
    label: "Code Correctness & Compiler Execution",
    keywords: ["accepted", "compilation", "passed", "test cases", "logic", "syntax"],
    rounds: [3],
  },
  {
    skill: "debugging",
    label: "Debugging & Error Resolution",
    keywords: ["debug", "runtime error", "nullpointer", "stack trace", "exception handling", "fix"],
    rounds: [2, 3],
  },
  {
    skill: "dbms_sql",
    label: "DBMS & SQL Querying",
    keywords: ["sql", "acid", "transaction", "index", "normalization", "join", "foreign key", "primary key", "btree"],
    rounds: [1, 2],
  },
  {
    skill: "operating_systems",
    label: "Operating Systems Internals",
    keywords: ["process", "thread", "deadlock", "mutex", "semaphore", "virtual memory", "paging", "context switch", "cpu scheduling"],
    rounds: [2],
  },
  {
    skill: "computer_networks",
    label: "Computer Networks & Protocols",
    keywords: ["tcp", "udp", "http", "https", "osi", "dns", "handshake", "socket", "ip"],
    rounds: [2],
  },
  {
    skill: "backend_engineering",
    label: "Backend & RESTful Architecture",
    keywords: ["rest", "api", "crud", "stateless", "microservices", "authentication", "jwt", "caching", "redis", "load balancer"],
    rounds: [2],
  },
  {
    skill: "project_knowledge",
    label: "Project Architecture & Engineering Trade-offs",
    keywords: ["project", "architecture", "trade-off", "scalability", "designed", "built", "database design", "deployment"],
    rounds: [2],
  },
  {
    skill: "english_communication",
    label: "English Communication & Articulation",
    keywords: ["clarity", "articulation", "explanation", "communication", "grammar"],
    rounds: [1, 2, 3, 4],
  },
  {
    skill: "behavioral",
    label: "Behavioral & STAR Responses",
    keywords: ["situation", "task", "action", "result", "conflict", "teamwork", "deadline", "leadership", "failure"],
    rounds: [4],
  },
];

export function computeSkillRadarAnalysis(input: AssessmentEvidenceInput): SkillRadarAnalysis {
  const { candidateAnswers, codeSubmissions, communicationReport } = input;
  const skills: SkillScoreItem[] = [];

  let hasKnowledgeGap = false;
  let hasReasoningGap = false;
  let hasImplementationGap = false;
  let hasCommunicationGap = false;

  for (const def of SKILL_DEFINITIONS) {
    if (def.skill === "english_communication") {
      if (communicationReport && candidateAnswers.length > 0) {
        skills.push({
          skill: def.skill,
          label: def.label,
          score: communicationReport.overallScore,
          assessed: true,
          evidence: `Assessed across ${candidateAnswers.length} responses. Clarity score ${communicationReport.clarityScore}%, grammar score ${communicationReport.grammarScore}%.`,
          strengthOrWeakness: communicationReport.overallScore >= 75 ? "Clear professional phrasing with structured thoughts." : "Contains grammatical inconsistencies or filler words.",
          limitations: "Evaluated from text transcriptions.",
          action: "Focus on concise opening statements and precise technical vocabulary.",
        });
        if (communicationReport.overallScore < 70) hasCommunicationGap = true;
      } else {
        skills.push({
          skill: def.skill,
          label: def.label,
          score: null,
          assessed: false,
          evidence: "No transcript recorded.",
          strengthOrWeakness: "Not Assessed",
          limitations: "Topic not evaluated in this session.",
          action: "Complete a full voice round to measure communication.",
        });
      }
      continue;
    }

    if (def.skill === "code_correctness") {
      if (codeSubmissions.length > 0) {
        const sub = codeSubmissions[0];
        const passRatio = sub.totalTests > 0 ? sub.passedTests / sub.totalTests : 0;
        let score = Math.round(passRatio * 100);
        if (sub.status === "accepted") score = 100;
        else if (sub.status === "compilation_error") score = 25;

        skills.push({
          skill: def.skill,
          label: def.label,
          score,
          assessed: true,
          evidence: `Submitted ${sub.language.toUpperCase()} solution with ${sub.passedTests}/${sub.totalTests} tests passed (${sub.status}).`,
          strengthOrWeakness: score >= 80 ? "Clean compilable code passing verified test cases." : "Encountered compiler or logical test case failures.",
          limitations: "Measured against standard test harnesses.",
          action: "Practice writing edge case checks before running test runs.",
        });
        if (score < 70) hasImplementationGap = true;
      } else {
        skills.push({
          skill: def.skill,
          label: def.label,
          score: null,
          assessed: false,
          evidence: "No code submitted in Round 3.",
          strengthOrWeakness: "Not Assessed",
          limitations: "Candidate did not submit code during this session.",
          action: "Complete Round 3 to assess code correctness.",
        });
      }
      continue;
    }

    // Match candidate answers with skill keywords
    const matchingAnswers = candidateAnswers.filter(a => {
      const text = `${a.questionText} ${a.answerText}`.toLowerCase();
      return def.keywords.some(k => text.includes(k)) && def.rounds.includes(a.roundNumber);
    });

    if (matchingAnswers.length > 0) {
      const scores = matchingAnswers.map(a => a.evaluationScore ?? 70);
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const sample = matchingAnswers[0];
      const evidence = `Assessed in Round ${sample.roundNumber} on "${sample.questionText.slice(0, 60)}..."`;

      const isStrength = avgScore >= 75;
      skills.push({
        skill: def.skill,
        label: def.label,
        score: avgScore,
        assessed: true,
        evidence,
        strengthOrWeakness: isStrength
          ? `Strong demonstrated understanding of core principles.`
          : `Gaps identified in depth, mechanics, or specific technical nuances.`,
        limitations: `Assessed via ${matchingAnswers.length} question(s).`,
        action: `Revise fundamental concepts and write sample code to solidify ${def.label}.`,
      });

      if (avgScore < 70) {
        if (["algorithmic_reasoning", "time_complexity", "space_complexity", "edge_case_analysis"].includes(def.skill)) {
          hasReasoningGap = true;
        } else if (["behavioral"].includes(def.skill)) {
          hasCommunicationGap = true;
        } else {
          hasKnowledgeGap = true;
        }
      }
    } else {
      skills.push({
        skill: def.skill,
        label: def.label,
        score: null,
        assessed: false,
        evidence: "No questions covering this topic were answered.",
        strengthOrWeakness: "Not Assessed",
        limitations: "Topic not evaluated in this session.",
        action: `Schedule a round emphasizing ${def.label}.`,
      });
    }
  }

  const assessedSkills = skills.filter(s => s.assessed && s.score !== null);
  const strongestSkills = [...assessedSkills]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)
    .map(s => s.label);

  const weakestSkills = [...assessedSkills]
    .filter(s => (s.score || 0) < 75)
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 3)
    .map(s => s.label);

  const unassessedSkills = skills.filter(s => !s.assessed).map(s => s.label);

  return {
    skills,
    strongestSkills: strongestSkills.length > 0 ? strongestSkills : ["Foundational Software Engineering Knowledge"],
    weakestSkills: weakestSkills.length > 0 ? weakestSkills : ["Consistent In-Depth Technical Justifications"],
    unassessedSkills,
    gapOrigin: {
      knowledgeGap: hasKnowledgeGap,
      reasoningGap: hasReasoningGap,
      implementationGap: hasImplementationGap,
      communicationGap: hasCommunicationGap,
    },
  };
}
