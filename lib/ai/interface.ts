import { RoundNumber, InterviewMode, CompanyProfile, RubricScoreItem, AnswerEvaluation, ClarificationResponse } from "../types";

export interface AIContext {
  sessionId: string;
  roundNumber: RoundNumber;
  roundName: string;
  companyProfile: CompanyProfile;
  targetRole: string;
  difficulty: string;
  mode: InterviewMode;
  primaryLanguage: string;
  resumeText?: string;
  recentConversation: {
    sender: "interviewer" | "candidate" | "system";
    messageType: string;
    content: string;
  }[];
}

export interface EvaluateAnswerParams {
  context: AIContext;
  questionText: string;
  expectedAnswer: string;
  candidateAnswer: string;
  rubricFocus?: string;
  isFollowUp?: boolean;
}

export interface CandidateQuestionParams {
  context: AIContext;
  currentQuestionText: string;
  candidateQuestion: string;
}

export interface GenerateFollowUpParams {
  context: AIContext;
  currentQuestionText: string;
  candidateAnswer: string;
  evaluation: AnswerEvaluation;
}

export interface GenerateReportParams {
  context: AIContext;
  answers: {
    roundNumber: RoundNumber;
    questionText: string;
    answerText: string;
    evaluationScore?: number | null;
    feedback?: string | null;
  }[];
  codingSubmissions?: {
    problemTitle: string;
    status: string;
    passed: number;
    total: number;
  }[];
}

export interface InterviewAIProvider {
  name: string;
  isConfigured(): boolean;
  evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation>;
  answerCandidateQuestion(params: CandidateQuestionParams): Promise<ClarificationResponse>;
  generateFollowUp(params: GenerateFollowUpParams): Promise<{ followUpQuestion: string }>;
  generateFinalReport(params: GenerateReportParams): Promise<{
    technicalStrengths: string[];
    areasForImprovement: string[];
    communicationAssessment: string;
    codingAssessmentSummary: string;
    sevenDayPlan: { day: number; focus: string; tasks: string[] }[];
    readinessLevel: "Strong Hire" | "Hire" | "Needs Practice" | "Major Revisions Needed";
    readinessSummary: string;
  }>;
  testConnection(): Promise<{ success: boolean; message: string; model?: string }>;
}
