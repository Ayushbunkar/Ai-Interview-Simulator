import { pgTable, text, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  category: text("category").notNull(), // 'java_oop', 'dbms_sql', 'os', 'networks', 'dsa_concepts', 'backend_api', 'system_design', 'behavioral'
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  companyTags: text("company_tags").notNull(), // JSON array: ["TCS", "Capgemini", "Product"]
  questionText: text("question_text").notNull(),
  expectedAnswer: text("expected_answer").notNull(),
  explanation: text("explanation").notNull(),
  followUps: text("follow_ups").notNull(), // JSON array of possible follow-up questions
  rubricFocus: text("rubric_focus"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const codingProblems = pgTable("coding_problems", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  difficulty: text("difficulty").notNull(), // 'easy', 'medium', 'hard'
  topicTags: text("topic_tags").notNull(), // JSON array
  description: text("description").notNull(),
  inputFormat: text("input_format").notNull(),
  outputFormat: text("output_format").notNull(),
  constraints: text("constraints").notNull(), // JSON array
  examples: text("examples").notNull(), // JSON array of {input, output, explanation}
  starterCodeJava: text("starter_code_java").notNull(),
  starterCodePython: text("starter_code_python").notNull(),
  starterCodeCpp: text("starter_code_cpp").notNull(),
  referenceSolutionJava: text("reference_solution_java").notNull(),
  referenceSolutionPython: text("reference_solution_python").notNull(),
  referenceSolutionCpp: text("reference_solution_cpp").notNull(),
  timeComplexity: text("time_complexity").notNull(),
  spaceComplexity: text("space_complexity").notNull(),
  hints: text("hints").notNull(), // JSON array of progressive hints
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const testCases = pgTable("test_cases", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").notNull().references(() => codingProblems.id),
  input: text("input").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
});

export const interviewSessions = pgTable("interview_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  targetRole: text("target_role").notNull(),
  companyProfile: text("company_profile").notNull(),
  difficulty: text("difficulty").notNull(), // 'fresher', 'junior', 'mid', 'senior'
  mode: text("mode").notNull(), // 'strict', 'practice'
  primaryLanguage: text("primary_language").notNull().default("java"),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  topicsEmphasized: text("topics_emphasized").notNull(), // JSON array
  resumeText: text("resume_text"),
  interviewModeVariant: text("interview_mode_variant").notNull().default("full_mock"), // 'full_mock', 'technical_fundamentals', 'advanced_technical', 'coding_interview', 'behavioral_hr', 'voice_practice', 'communication_practice', 'pressure_interview', 'revision_interview'
  resumeProfileId: text("resume_profile_id"),
  status: text("status").notNull().default("setup"), // 'setup', 'in_progress', 'paused', 'completed', 'abandoned'
  currentRound: integer("current_round").notNull().default(1), // 1 to 4
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  timeRemainingSeconds: integer("time_remaining_seconds").notNull().default(3600),
  isPaused: boolean("is_paused").notNull().default(false),
  startedAt: timestamp("started_at", { mode: "date" }),
  pausedAt: timestamp("paused_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  totalScore: integer("total_score"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const interviewRounds = pgTable("interview_rounds", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(), // 1, 2, 3, 4
  roundName: text("round_name").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  score: integer("score"),
  rubricScores: text("rubric_scores"), // JSON array
  roundFeedback: text("round_feedback"),
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const conversationMessages = pgTable("conversation_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(),
  sender: text("sender").notNull(), // 'interviewer', 'candidate', 'system'
  messageType: text("message_type").notNull(), // 'question', 'answer', 'clarification_question', 'clarification_answer', 'followup', 'feedback', 'instruction'
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
});

export const candidateAnswers = pgTable("candidate_answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(),
  questionId: text("question_id"),
  questionText: text("question_text").notNull(),
  answerText: text("answer_text").notNull(),
  evaluationScore: integer("evaluation_score"),
  rubricBreakdown: text("rubric_breakdown"), // JSON array
  strengths: text("strengths"), // JSON array
  weaknesses: text("weaknesses"), // JSON array
  feedback: text("feedback"),
  followUpAsked: text("follow_up_asked"),
  followUpAnswer: text("follow_up_answer"),
  followUpEvaluation: text("follow_up_evaluation"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const codeSubmissions = pgTable("code_submissions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  problemId: text("problem_id").notNull().references(() => codingProblems.id),
  language: text("language").notNull(), // 'java', 'python', 'cpp'
  code: text("code").notNull(),
  status: text("status").notNull(), // 'accepted', 'wrong_answer', 'compilation_error', 'runtime_error', 'time_limit_exceeded'
  passedTests: integer("passed_tests").notNull().default(0),
  totalTests: integer("total_tests").notNull().default(0),
  runtimeMs: real("runtime_ms"),
  memoryKb: integer("memory_kb"),
  compileOutput: text("compile_output"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const executionResults = pgTable("execution_results", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => codeSubmissions.id),
  testCaseId: text("test_case_id").notNull().references(() => testCases.id),
  passed: boolean("passed").notNull(),
  actualOutput: text("actual_output"),
  expectedOutput: text("expected_output"),
  executionTimeMs: real("execution_time_ms"),
  memoryKb: integer("memory_kb"),
  error: text("error"),
});

export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(),
  overallScore: integer("overall_score").notNull(),
  rubricScores: text("rubric_scores").notNull(), // JSON
  strengths: text("strengths").notNull(), // JSON
  improvements: text("improvements").notNull(), // JSON
  detailedNotes: text("detailed_notes").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const interviewReports = pgTable("interview_reports", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  overallScore: integer("overall_score").notNull(),
  roundScores: text("round_scores").notNull(), // JSON array
  technicalStrengths: text("technical_strengths").notNull(), // JSON array
  areasForImprovement: text("areas_for_improvement").notNull(), // JSON array
  communicationAssessment: text("communication_assessment").notNull(),
  codingAssessment: text("coding_assessment").notNull(), // JSON
  sevenDayPlan: text("seven_day_plan").notNull(), // JSON array
  readinessSummary: text("readiness_summary").notNull(),
  readinessLevel: text("readiness_level").notNull(), // 'Strong Hire', 'Hire', 'Needs Practice', 'Major Revisions'
  markdownExport: text("markdown_export").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: text("id").primaryKey(),
  itemType: text("item_type").notNull(), // 'question' | 'problem'
  itemId: text("item_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const resumeProfiles = pgTable("resume_profiles", {
  id: text("id").primaryKey(),
  candidateName: text("candidate_name"),
  targetRole: text("target_role"),
  experienceLevel: text("experience_level"),
  rawResumeText: text("raw_resume_text"),
  rawJobDescription: text("raw_job_description"),
  extractedSkills: text("extracted_skills").notNull().default("[]"), // JSON string array
  extractedProjects: text("extracted_projects").notNull().default("[]"), // JSON string array of project objects
  extractedTechnologies: text("extracted_technologies").notNull().default("[]"), // JSON string array
  extractedTopics: text("extracted_topics").notNull().default("[]"), // JSON string array
  jobRequirements: text("job_requirements").notNull().default("[]"), // JSON string array
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const candidateSkillsProfile = pgTable("candidate_skills_profile", {
  id: text("id").primaryKey(),
  skillCategory: text("skill_category").notNull().unique(), // 'java_fundamentals', 'oop', 'dsa', 'complexity_analysis', 'dbms_sql', 'operating_systems', 'computer_networks', 'backend_engineering', 'problem_solving', 'debugging', 'code_correctness', 'english_grammar', 'technical_communication', 'behavioral'
  label: text("label").notNull(),
  status: text("status").notNull().default("not_assessed"), // 'not_assessed', 'weak', 'proficient', 'mastered'
  score: integer("score"), // null if not_assessed
  timesAssessed: integer("times_assessed").notNull().default(0),
  timesCorrect: integer("times_correct").notNull().default(0),
  evidenceNotes: text("evidence_notes").notNull().default("[]"), // JSON string array of citations
  lastAssessedAt: timestamp("last_assessed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const revisionQueue = pgTable("revision_queue", {
  id: text("id").primaryKey(),
  itemType: text("item_type").notNull(), // 'question' | 'problem' | 'weakness_topic'
  questionId: text("question_id"),
  problemId: text("problem_id"),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  skillCategory: text("skill_category").notNull(),
  reason: text("reason").notNull(), // 'previously_incorrect', 'low_confidence', 'repeated_mistake', 'due_for_revision'
  evidenceContext: text("evidence_context").notNull(),
  referenceNotes: text("reference_notes").notNull(),
  repetitionCount: integer("repetition_count").notNull().default(0),
  intervalDays: integer("interval_days").notNull().default(1),
  easeFactor: real("ease_factor").notNull().default(2.5),
  nextReviewDue: timestamp("next_review_due", { mode: "date" }).notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // 'pending', 'reviewed', 'mastered'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const revisionAttempts = pgTable("revision_attempts", {
  id: text("id").primaryKey(),
  revisionItemId: text("revision_item_id").notNull().references(() => revisionQueue.id),
  candidateResponse: text("candidate_response").notNull(),
  score: integer("score").notNull(),
  feedback: text("feedback").notNull(),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }).notNull().defaultNow(),
});

export const apiUsageLogs = pgTable("api_usage_logs", {
  id: text("id").primaryKey(),
  service: text("service").notNull(), // 'groq_ai', 'onlinecompiler', 'system'
  endpoint: text("endpoint").notNull(),
  modelOrLang: text("model_or_lang").notNull(),
  status: text("status").notNull(), // 'success', 'error', 'timeout', 'rate_limited'
  responseTimeMs: integer("response_time_ms").notNull(),
  promptTokensEst: integer("prompt_tokens_est").notNull().default(0),
  completionTokensEst: integer("completion_tokens_est").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const codingStepsLog = pgTable("coding_steps_log", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  problemId: text("problem_id").notNull().references(() => codingProblems.id),
  stepType: text("step_type").notNull(), // 'approach_explained', 'brute_force_proposed', 'optimized_chosen', 'complexity_stated', 'code_revision', 'compiler_run', 'debugging_step', 'ai_probe'
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
