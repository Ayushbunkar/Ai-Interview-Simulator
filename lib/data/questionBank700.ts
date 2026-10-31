import questionsData from "./question-bank-700.json";

export interface QuestionBankItem {
  id: string;
  catId: number;
  category: string;
  num: number;
  question: string;
  modelAnswer: string;
  keyPoints: string[];
  difficulty: "Fresher" | "Core" | "Advanced";
  sampleSpokenStart: string;
}

export interface CategoryMeta {
  catId: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  icon: string;
  gradient: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    catId: 1,
    name: "Java + OOP",
    slug: "java-oop",
    description: "Core Java, JVM internals, Memory Model, OOP pillars, Collections & Concurrency",
    count: 50,
    icon: "Coffee",
    gradient: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    catId: 2,
    name: "DBMS",
    slug: "dbms",
    description: "Relational theory, ACID, Normalization, Indexing, Transactions & Locking",
    count: 50,
    icon: "Database",
    gradient: "from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    catId: 3,
    name: "SQL",
    slug: "sql",
    description: "Complex Joins, CTEs, Window functions, Aggregations & Query Optimization",
    count: 50,
    icon: "Terminal",
    gradient: "from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    catId: 4,
    name: "Operating Systems",
    slug: "os",
    description: "Processes, Threads, CPU scheduling, Memory management, Paging & Deadlocks",
    count: 50,
    icon: "Cpu",
    gradient: "from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30",
  },
  {
    catId: 5,
    name: "Computer Networks",
    slug: "networks",
    description: "OSI & TCP/IP models, Handshakes, DNS, Subnetting, Routing & HTTP/HTTPS",
    count: 50,
    icon: "Network",
    gradient: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    catId: 6,
    name: "REST APIs",
    slug: "rest-apis",
    description: "HTTP verbs, Status codes, Idempotency, JWT auth, Rate limiting & Webhooks",
    count: 50,
    icon: "Globe",
    gradient: "from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30",
  },
  {
    catId: 7,
    name: "Security",
    slug: "security",
    description: "OWASP Top 10, SQLi, XSS, CSRF, Cryptography, Hashing, OAuth2 & TLS",
    count: 50,
    icon: "ShieldAlert",
    gradient: "from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30",
  },
  {
    catId: 8,
    name: "Git and GitHub",
    slug: "git-github",
    description: "Branching, Merging vs Rebasing, Conflicts, Reflog, Stash, Hooks & Workflows",
    count: 50,
    icon: "GitBranch",
    gradient: "from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30",
  },
  {
    catId: 9,
    name: "Software Testing",
    slug: "testing",
    description: "Unit, Integration, E2E, TDD, BDD, Boundary Value Analysis & Test Doubles",
    count: 50,
    icon: "CheckCircle2",
    gradient: "from-lime-500/20 to-green-500/20 text-lime-400 border-lime-500/30",
  },
  {
    catId: 10,
    name: "Linux",
    slug: "linux",
    description: "Filesystem hierarchy, Permissions, Piping, Grep, Systemd, Cron & Troubleshooting",
    count: 50,
    icon: "TerminalSquare",
    gradient: "from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30",
  },
  {
    catId: 11,
    name: "Low-Level Design (LLD)",
    slug: "lld",
    description: "SOLID principles, Design Patterns, Class diagrams & Object-Oriented Modeling",
    count: 50,
    icon: "Boxes",
    gradient: "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border-fuchsia-500/30",
  },
  {
    catId: 12,
    name: "High-Level Design (HLD) / System Design",
    slug: "hld",
    description: "Scalability, Load Balancing, Caching, Sharding, Message Queues & Microservices",
    count: 50,
    icon: "Layers",
    gradient: "from-blue-600/20 to-indigo-600/20 text-blue-400 border-blue-500/30",
  },
  {
    catId: 13,
    name: "Projects",
    slug: "projects",
    description: "Architecture justification, Technical challenges, Trade-offs & Production scaling",
    count: 50,
    icon: "FolderGit2",
    gradient: "from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    catId: 14,
    name: "Resume and HR/Technical Introduction",
    slug: "resume-hr",
    description: "Tell me about yourself, Strengths, Weaknesses, Team conflict & Career vision",
    count: 50,
    icon: "UserCheck",
    gradient: "from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30",
  },
  {
    catId: 15,
    name: "AI & Machine Learning Engineering",
    slug: "ai-ml",
    description: "ML Foundations, Loss Functions, Deep Learning, CNNs, Transformers, LLMs, RAG, PEFT/LoRA & MLOps",
    count: 100,
    icon: "BrainCircuit",
    gradient: "from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  },
];

export const ALL_QUESTIONS: QuestionBankItem[] = questionsData as QuestionBankItem[];

export function getQuestionsByCategory(catIdOrAll: number | "all"): QuestionBankItem[] {
  if (catIdOrAll === "all") return ALL_QUESTIONS;
  return ALL_QUESTIONS.filter(q => q.catId === catIdOrAll);
}

export function getRandomQuestion(
  catIdOrAll: number | "all",
  excludeId?: string
): QuestionBankItem {
  const pool = getQuestionsByCategory(catIdOrAll);
  const filtered = excludeId && pool.length > 1 ? pool.filter(q => q.id !== excludeId) : pool;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  return filtered[randomIndex] || pool[0];
}

export function getQuestionById(id: string): QuestionBankItem | undefined {
  return ALL_QUESTIONS.find(q => q.id === id);
}
