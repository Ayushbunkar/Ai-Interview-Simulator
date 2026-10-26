export type RoundNumber = 1 | 2 | 3 | 4;

export type InterviewRoundName =
  | "Technical Fundamentals"
  | "Advanced CS & Projects"
  | "Coding Interview"
  | "Behavioral & HR";

export type InterviewMode = "strict" | "practice";

export type CompanyProfile =
  | "TCS"
  | "Capgemini"
  | "Service-Based General"
  | "Product-Based Engineering"
  | "Java / Backend Specialist"
  | "AI / ML & GenAI"
  | "Custom / General";

export type ExperienceLevel = "fresher" | "entry_level" | "intermediate" | "experienced";

export type ProgrammingLanguage = "java" | "python" | "cpp";

export type SessionStatus = "setup" | "in_progress" | "paused" | "completed" | "abandoned";

export type RoundStatus = "pending" | "in_progress" | "completed";

export type MessageSender = "interviewer" | "candidate" | "system";

export type MessageType =
  | "question"
  | "answer"
  | "clarification_question"
  | "clarification_answer"
  | "followup"
  | "feedback"
  | "instruction";

export interface RubricScoreItem {
  name: string;
  weight: number; // e.g. 35 for 35%
  score: number; // 0 to 100
  notes: string;
}

export interface AnswerEvaluation {
  score: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  rubricScores: RubricScoreItem[];
  suggestedFollowUp?: string;
  isSatisfactory: boolean;
}

export interface ClarificationResponse {
  message: string;
  clarified: boolean;
  preservesOriginalQuestion: boolean;
}

export interface FollowUpEvaluation {
  score: number;
  feedback: string;
  rubricScores: RubricScoreItem[];
}

export interface CodingSubmissionResult {
  submissionId: string;
  problemId: string;
  status: "accepted" | "wrong_answer" | "compilation_error" | "runtime_error" | "time_limit_exceeded" | "unconfigured";
  passedCount: number;
  totalCount: number;
  runtimeMs?: number;
  memoryKb?: number;
  compileOutput?: string;
  errorMessage?: string;
  testResults: {
    testCaseId: string;
    passed: boolean;
    actualOutput?: string;
    expectedOutput?: string;
    error?: string;
    executionTimeMs?: number;
  }[];
}

export interface FinalReportSummary {
  overallScore: number;
  rounds: {
    roundNumber: RoundNumber;
    roundName: string;
    score: number;
    completed: boolean;
    feedback: string;
    rubricBreakdown: RubricScoreItem[];
  }[];
  strongestAreas: string[];
  weakestAreas: string[];
  technicalStrengths: string[];
  areasForImprovement: string[];
  communicationFeedback: string;
  codingAssessment: {
    problemsAttempted: number;
    problemsPassed: number;
    algorithmFeedback: string;
    complexityFeedback: string;
  };
  sevenDayPracticePlan: {
    day: number;
    focus: string;
    tasks: string[];
  }[];
  finalReadinessAssessment: "Strong Hire" | "Hire" | "Needs Practice" | "Major Revisions Needed";
  readinessSummary: string;
}
