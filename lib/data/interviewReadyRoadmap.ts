import roadmapDaysData from "./interviewReadyDays.json";

export interface RoadmapQuestion {
  id: string;
  qNum: number;
  question: string;
  answer: string;
  logic: string;
  codeSnippet?: string;
}

export interface RoadmapDiagram {
  title: string;
  caption: string;
  type: "flowchart" | "architecture" | "table" | "sequence";
  nodes: { label: string; desc?: string; highlight?: boolean }[];
  connections?: string[];
  asciiArt?: string;
}

export interface RoadmapDay {
  dayNumber: number;
  date: string; // e.g. "November 1"
  phaseId: number;
  phaseName: string;
  title: string;
  description: string;
  studyTopics: string[];
  questions: RoadmapQuestion[];
  practicalTask: {
    title: string;
    instructions: string;
    solutionHint: string;
    codeExample?: string;
  };
  diagram?: RoadmapDiagram;
}

export interface RoadmapPhase {
  phaseId: number;
  name: string;
  dateRange: string;
  daysCount: number;
  priority: "S" | "A" | "B";
  priorityLabel: string;
  summary: string;
  dayStart: number;
  dayEnd: number;
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phaseId: 1,
    name: "JAVA + OOP",
    dateRange: "November 1–4",
    daysCount: 4,
    priority: "S",
    priorityLabel: "S-Tier (Mandatory Depth)",
    summary: "OOP fundamentals, 4 Pillars, Abstraction, Polymorphism, and SOLID Principles.",
    dayStart: 1,
    dayEnd: 4,
  },
  {
    phaseId: 2,
    name: "DBMS + SQL",
    dateRange: "November 5–10",
    daysCount: 6,
    priority: "S",
    priorityLabel: "S-Tier (Mandatory Depth)",
    summary: "Relational theory, Keys, Complex Joins, CTEs, Window functions, Normalization & ACID.",
    dayStart: 5,
    dayEnd: 10,
  },
  {
    phaseId: 3,
    name: "OPERATING SYSTEMS",
    dateRange: "November 11–15",
    daysCount: 5,
    priority: "S",
    priorityLabel: "S-Tier (Mandatory Depth)",
    summary: "Processes, Threads, CPU Scheduling, Mutex/Semaphores, Deadlocks & Virtual Memory.",
    dayStart: 11,
    dayEnd: 15,
  },
  {
    phaseId: 4,
    name: "COMPUTER NETWORKS",
    dateRange: "November 16–20",
    daysCount: 5,
    priority: "S",
    priorityLabel: "S-Tier (Mandatory Depth)",
    summary: "OSI & TCP/IP, IP & Subnetting, TCP 3-Way Handshake, HTTP/HTTPS, TLS & DNS.",
    dayStart: 16,
    dayEnd: 20,
  },
  {
    phaseId: 5,
    name: "REST API + SECURITY",
    dateRange: "November 21–22",
    daysCount: 2,
    priority: "A",
    priorityLabel: "A-Tier (Practical Understanding)",
    summary: "REST constraints, Idempotency, Status codes, JWT auth, OWASP Top 10, XSS, CSRF & SQLi.",
    dayStart: 21,
    dayEnd: 22,
  },
  {
    phaseId: 6,
    name: "GIT, TESTING, LINUX AND DEPLOYMENT",
    dateRange: "November 23–24",
    daysCount: 2,
    priority: "B",
    priorityLabel: "B-Tier (Working Knowledge)",
    summary: "Branching, Merging vs Rebasing, Unit/Integration tests, Linux CLI & CI/CD deployment.",
    dayStart: 23,
    dayEnd: 24,
  },
  {
    phaseId: 7,
    name: "LOW LEVEL DESIGN (LLD)",
    dateRange: "November 25–27",
    daysCount: 3,
    priority: "A",
    priorityLabel: "A-Tier (Practical Understanding)",
    summary: "UML diagrams, Design patterns (Singleton, Factory, Strategy, Observer), Parking Lot & LLD problems.",
    dayStart: 25,
    dayEnd: 27,
  },
  {
    phaseId: 8,
    name: "HIGH LEVEL DESIGN (HLD)",
    dateRange: "November 28–29",
    daysCount: 2,
    priority: "A",
    priorityLabel: "A-Tier (Basic/Intermediate)",
    summary: "Scalability, Load balancers, Caching (Redis), Message queues (Kafka), URL Shortener & Chat App.",
    dayStart: 28,
    dayEnd: 29,
  },
  {
    phaseId: 9,
    name: "PROJECTS + RESUME",
    dateRange: "November 30",
    daysCount: 1,
    priority: "S",
    priorityLabel: "S-Tier (Very Strong)",
    summary: "Project architecture defense, Frontend/Backend cross-examination, and Final 60-Minute Mock.",
    dayStart: 30,
    dayEnd: 30,
  },
];

export const DAILY_CHECKLIST_ITEMS = [
  "I understand the concept without memorizing its definition.",
  "I can explain it in my own words in 1–2 minutes.",
  "I can give a real-world software engineering example.",
  "I can answer the listed interview questions without looking at notes.",
  "I have completed the practical hands-on task.",
  "I have revised and tested my understanding after studying.",
];

export const DECEMBER_GOALS = [
  { id: "g1", title: "Java OOP and SOLID principles mastery", phase: "Java + OOP" },
  { id: "g2", title: "DBMS fundamentals & Relational Keys", phase: "DBMS" },
  { id: "g3", title: "SQL complex queries (Joins, CTEs, Window functions)", phase: "SQL" },
  { id: "g4", title: "Normalization (1NF-BCNF), ACID and Indexing", phase: "DBMS" },
  { id: "g5", title: "OS processes, threads, context switching & scheduling", phase: "Operating Systems" },
  { id: "g6", title: "Process synchronization, Mutex/Semaphores & Deadlocks", phase: "Operating Systems" },
  { id: "g7", title: "Memory management, Paging, Page faults & Thrashing", phase: "Operating Systems" },
  { id: "g8", title: "OSI 7-Layers, TCP/IP & IP Subnetting", phase: "Computer Networks" },
  { id: "g9", title: "DNS resolution lifecycle, HTTP methods & HTTPS TLS", phase: "Computer Networks" },
  { id: "g10", title: "REST API design, Status codes & JWT Authentication", phase: "REST API + Security" },
  { id: "g11", title: "Git workflows, Testing levels & Essential Linux commands", phase: "Git & Linux" },
  { id: "g12", title: "Parking Lot complete Low-Level Design (LLD)", phase: "LLD" },
  { id: "g13", title: "ATM / Vending Machine / Movie Booking LLD designs", phase: "LLD" },
  { id: "g14", title: "Basic HLD architecture & 3 system design problems (Bitly, Chat, Notify)", phase: "HLD" },
  { id: "g15", title: "Project deep-dive architecture & complete resume defense", phase: "Projects & Resume" },
  { id: "g16", title: "One complete 60-minute technical mock interview", phase: "Mock Interview" },
];

export const ROADMAP_DAYS: RoadmapDay[] = roadmapDaysData as RoadmapDay[];

export function getDayByNumber(dayNum: number): RoadmapDay | undefined {
  return ROADMAP_DAYS.find(d => d.dayNumber === dayNum);
}

export function getDaysByPhase(phaseId: number): RoadmapDay[] {
  return ROADMAP_DAYS.filter(d => d.phaseId === phaseId);
}

