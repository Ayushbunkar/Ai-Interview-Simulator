import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const questions = sqliteTable("questions", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const codingProblems = sqliteTable("coding_problems", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const testCases = sqliteTable("test_cases", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").notNull().references(() => codingProblems.id),
  input: text("input").notNull(),
  expectedOutput: text("expected_output").notNull(),
  isHidden: integer("is_hidden", { mode: "boolean" }).notNull().default(false),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
});

export const interviewSessions = sqliteTable("interview_sessions", {
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
  status: text("status").notNull().default("setup"), // 'setup', 'in_progress', 'paused', 'completed', 'abandoned'
  currentRound: integer("current_round").notNull().default(1), // 1 to 4
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  timeRemainingSeconds: integer("time_remaining_seconds").notNull().default(3600),
  isPaused: integer("is_paused", { mode: "boolean" }).notNull().default(false),
  startedAt: integer("started_at", { mode: "timestamp" }),
  pausedAt: integer("paused_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  totalScore: integer("total_score"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewRounds = sqliteTable("interview_rounds", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(), // 1, 2, 3, 4
  roundName: text("round_name").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
  score: integer("score"),
  rubricScores: text("rubric_scores"), // JSON array
  roundFeedback: text("round_feedback"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const conversationMessages = sqliteTable("conversation_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(),
  sender: text("sender").notNull(), // 'interviewer', 'candidate', 'system'
  messageType: text("message_type").notNull(), // 'question', 'answer', 'clarification_question', 'clarification_answer', 'followup', 'feedback', 'instruction'
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export const candidateAnswers = sqliteTable("candidate_answers", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const codeSubmissions = sqliteTable("code_submissions", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const executionResults = sqliteTable("execution_results", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => codeSubmissions.id),
  testCaseId: text("test_case_id").notNull().references(() => testCases.id),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  actualOutput: text("actual_output"),
  expectedOutput: text("expected_output"),
  executionTimeMs: real("execution_time_ms"),
  memoryKb: integer("memory_kb"),
  error: text("error"),
});

export const evaluations = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => interviewSessions.id),
  roundNumber: integer("round_number").notNull(),
  overallScore: integer("overall_score").notNull(),
  rubricScores: text("rubric_scores").notNull(), // JSON
  strengths: text("strengths").notNull(), // JSON
  improvements: text("improvements").notNull(), // JSON
  detailedNotes: text("detailed_notes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const interviewReports = sqliteTable("interview_reports", {
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  itemType: text("item_type").notNull(), // 'question' | 'problem'
  itemId: text("itemId").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
