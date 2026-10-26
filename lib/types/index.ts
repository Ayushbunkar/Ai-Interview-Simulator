export type RoundNumber = 1 | 2 | 3 | 4;

export type InterviewRoundName =
  | "Technical Fundamentals"
  | "Advanced CS & Projects"
  | "Coding Interview"
  | "Behavioral & HR";

export type InterviewMode = "strict" | "practice";

export type InterviewModeVariant =
  | "full_mock"
  | "technical_fundamentals"
  | "advanced_technical"
  | "coding_interview"
  | "behavioral_hr"
  | "voice_practice"
  | "communication_practice"
  | "pressure_interview"
  | "revision_interview";

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

export type VoiceState =
  | "idle"
  | "interviewer_speaking"
  | "ready_to_listen"
  | "user_speaking"
  | "processing_answer"
  | "interviewer_thinking"
  | "error";

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

// ---------------------------------------------------------------------------
// Communication & Grammar Assessment Types
// ---------------------------------------------------------------------------
export interface CommunicationIssue {
  submittedSentence: string;
  identifiedIssue: string;
  correctedSentence: string;
  reason: string;
  improvedInterviewVersion?: string;
}

export interface CommunicationReport {
  overallScore: number;
  grammarScore: number;
  clarityScore: number;
  technicalExplanationScore: number;
  repeatedMistakes: string[];
  issues: CommunicationIssue[];
  fillerWordCount: number;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Granular Skill Assessment Types (16 Independent Categories)
// ---------------------------------------------------------------------------
export type SkillCategory =
  | "java_fundamentals"
  | "oop"
  | "dsa"
  | "algorithmic_reasoning"
  | "time_complexity"
  | "space_complexity"
  | "edge_case_analysis"
  | "code_correctness"
  | "debugging"
  | "dbms_sql"
  | "operating_systems"
  | "computer_networks"
  | "backend_engineering"
  | "project_knowledge"
  | "english_communication"
  | "behavioral";

export interface SkillScoreItem {
  skill: SkillCategory;
  label: string;
  score: number | null; // null if not assessed
  assessed: boolean;
  evidence: string;
  strengthOrWeakness: string;
  limitations: string;
  action: string;
}

export interface SkillRadarAnalysis {
  skills: SkillScoreItem[];
  strongestSkills: string[];
  weakestSkills: string[];
  unassessedSkills: string[];
  gapOrigin: {
    knowledgeGap: boolean;
    reasoningGap: boolean;
    implementationGap: boolean;
    communicationGap: boolean;
  };
}

// ---------------------------------------------------------------------------
// Multi-Level Detailed Coding Assessment Types
// ---------------------------------------------------------------------------
export interface DetailedProblemCodingReport {
  problemId: string;
  problemTitle: string;
  difficulty: string;
  problemStatement: string;
  spokenApproach: string;
  submittedCode: string;
  language: string;
  compilerStatus: string;
  testsPassed: number;
  totalTests: number;
  runtimeMs?: number;
  memoryKb?: number;
  timeComplexityClaimed: string;
  spaceComplexityClaimed: string;
  edgeCasesMissed: string[];
  codeQualityAssessment: string;
  correctnessAssessment: string;
  preferredApproachExplanation: string;
  optimizedSolutionCode: string;
  practiceRecommendations: string[];
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
  communicationReport?: CommunicationReport;
  skillRadar?: SkillRadarAnalysis;
  detailedCodingReports?: DetailedProblemCodingReport[];
  codingAssessment: {
    problemsAttempted: number;
    problemsPassed: number;
    algorithmFeedback: string;
    complexityFeedback: string;
  };
  behavioralAssessment?: {
    answerSpecificity: string;
    ownership: string;
    structureScore: number;
    useOfStar: string;
    missingDetails: string[];
    improvedOutlines: string[];
    recommendations: string[];
  };
  sevenDayPracticePlan: {
    day: number;
    focus: string;
    tasks: string[];
    linkedEvidence?: string;
  }[];
  finalReadinessAssessment: "Strong Hire" | "Hire" | "Needs Practice" | "Major Revisions Needed";
  readinessSummary: string;
}

// ---------------------------------------------------------------------------
// Phase 2 Intelligence & Analytics Types
// ---------------------------------------------------------------------------
export interface ExtractedProject {
  name: string;
  technologies: string[];
  responsibilities: string[];
  architecture?: string;
  tradeOffs?: string;
  claimedImpact?: string;
}

export interface ResumeProfileData {
  id: string;
  candidateName?: string;
  targetRole?: string;
  experienceLevel?: string;
  rawResumeText?: string;
  rawJobDescription?: string;
  extractedSkills: string[];
  extractedProjects: ExtractedProject[];
  extractedTechnologies: string[];
  extractedTopics: string[];
  jobRequirements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CandidateSkillRecord {
  id: string;
  skillCategory: string;
  label: string;
  status: "not_assessed" | "weak" | "proficient" | "mastered";
  score: number | null;
  timesAssessed: number;
  timesCorrect: number;
  evidenceNotes: string[];
  lastAssessedAt?: string | null;
}

export interface RevisionItem {
  id: string;
  itemType: "question" | "problem" | "weakness_topic";
  questionId?: string;
  problemId?: string;
  title: string;
  topic: string;
  skillCategory: string;
  reason: "previously_incorrect" | "low_confidence" | "repeated_mistake" | "due_for_revision";
  evidenceContext: string;
  referenceNotes: string;
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDue: string;
  status: "pending" | "reviewed" | "mastered";
  createdAt: string;
  updatedAt: string;
}

export type CodingStepType =
  | "approach_explained"
  | "brute_force_proposed"
  | "optimized_chosen"
  | "complexity_stated"
  | "code_revision"
  | "compiler_run"
  | "debugging_step"
  | "ai_probe";

export interface CodingStepEntry {
  id: string;
  sessionId: string;
  problemId: string;
  stepType: CodingStepType;
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface APIUsageSummary {
  totalAiRequests: number;
  totalCompilerRequests: number;
  totalErrors: number;
  totalTimeouts: number;
  totalRetries: number;
  estimatedTokens: number;
  isEstimated: boolean;
  recentLogs: {
    service: string;
    endpoint: string;
    status: string;
    responseTimeMs: number;
    createdAt: string;
  }[];
}

export interface HistoricalAnalyticsSummary {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  scoreTrend: { date: string; score: number; title: string }[];
  roundAverages: { round: string; averageScore: number }[];
  topicMastery: { topic: string; score: number; status: string }[];
  codingAcceptanceRate: number;
  repeatedMistakes: string[];
  englishProficiencyTrend: { date: string; grammarScore: number; clarityScore: number }[];
  revisionCompletionRate: number;
  hasSufficientData: boolean;
}

// ---------------------------------------------------------------------------
// Resume-Aware Intelligent Interview Engine Types
// ---------------------------------------------------------------------------
export interface CandidateEducation {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  year?: string;
}

export interface CandidateWorkExperience {
  company: string;
  role: string;
  duration?: string;
  responsibilities: string[];
  technologiesUsed: string[];
}

export interface CandidateProjectRecord {
  name: string;
  description: string;
  technologies: string[];
  personalContribution?: string;
  architecture?: string;
  tradeOffs?: string;
  sourceText: string;
}

export interface StructuredResumeSkills {
  programmingLanguages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  aiMl: string[];
  devops: string[];
  testing: string[];
  tools: string[];
  other: string[];
}

export interface ResumeClaimItem {
  claim: string;
  sourceSection: string;
  supportingText: string;
  priority: "high" | "medium" | "low";
  verified?: boolean;
  assessmentNotes?: string;
}

export interface CandidateProfileStructured {
  name?: string;
  education: CandidateEducation[];
  experience: CandidateWorkExperience[];
  internships: CandidateWorkExperience[];
  projects: CandidateProjectRecord[];
  skills: StructuredResumeSkills;
  certifications: string[];
  resumeClaims: ResumeClaimItem[];
}

export interface SkillSourceClassification {
  name: string;
  category: string;
  explicitlyListed: boolean;
  demonstratedThroughProjects: boolean;
  usedProfessionally: boolean;
  mentionedBriefly: boolean;
  inferred: boolean;
}

export interface InterviewBlueprint {
  id: string;
  sessionId: string;
  resumeProfileId?: string;
  primaryStack: string[];
  secondarySkills: string[];
  highPriorityTopics: string[];
  mediumPriorityTopics: string[];
  supportingFundamentals: string[];
  resumeClaims: ResumeClaimItem[];
  primaryLanguage: "java" | "python" | "cpp" | "javascript";
  plannedDistribution: Record<number, { topic: string; focus: string; questionsCount: number }>;
  technologyInterviewTrees: Record<string, string[]>;
  rawBlueprintJson?: any;
}

export interface ResumeAssessmentDossier {
  technologiesFound: string[];
  technologiesDeeplyAssessed: string[];
  skillsDemonstratedConvincingly: string[];
  skillsListedNotDemonstrated: string[];
  projectClaimsExplainedWithDepth: string[];
  topicsRequiringImprovement: string[];
  codingPatternsCausingDifficulty: string[];
  technicalAnswersIncompleteOrIncorrect: string[];
  englishCommunicationErrors: string[];
  prioritizedStudyPlan: Array<{
    priority: number;
    skill: string;
    reason: string;
    studyTopics: string[];
  }>;
  resumeTopicsRemainingUnassessed: string[];
  recommendedFollowUpInterview: string;
}
