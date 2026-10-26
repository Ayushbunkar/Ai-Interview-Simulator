import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const defaultDbUrl = process.env.VERCEL ? "file:/tmp/interviewforge.db" : "file:interviewforge.db";
const dbUrl = process.env.DATABASE_URL || defaultDbUrl;
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const sqliteClient = createClient({
  url: dbUrl,
  authToken: authToken,
});

export const db = drizzle(sqliteClient, { schema });

// Auto-initialize SQLite tables deterministically if they do not exist
let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  try {
    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        topic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        company_tags TEXT NOT NULL,
        question_text TEXT NOT NULL,
        expected_answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        follow_ups TEXT NOT NULL,
        rubric_focus TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS coding_problems (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        difficulty TEXT NOT NULL,
        topic_tags TEXT NOT NULL,
        description TEXT NOT NULL,
        input_format TEXT NOT NULL,
        output_format TEXT NOT NULL,
        constraints TEXT NOT NULL,
        examples TEXT NOT NULL,
        starter_code_java TEXT NOT NULL,
        starter_code_python TEXT NOT NULL,
        starter_code_cpp TEXT NOT NULL,
        reference_solution_java TEXT NOT NULL,
        reference_solution_python TEXT NOT NULL,
        reference_solution_cpp TEXT NOT NULL,
        time_complexity TEXT NOT NULL,
        space_complexity TEXT NOT NULL,
        hints TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL REFERENCES coding_problems(id),
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        is_hidden INTEGER NOT NULL DEFAULT 0,
        explanation TEXT,
        order_index INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        target_role TEXT NOT NULL,
        company_profile TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        mode TEXT NOT NULL,
        primary_language TEXT NOT NULL DEFAULT 'java',
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        topics_emphasized TEXT NOT NULL,
        resume_text TEXT,
        status TEXT NOT NULL DEFAULT 'setup',
        current_round INTEGER NOT NULL DEFAULT 1,
        current_question_index INTEGER NOT NULL DEFAULT 0,
        time_remaining_seconds INTEGER NOT NULL DEFAULT 3600,
        is_paused INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER,
        paused_at INTEGER,
        completed_at INTEGER,
        total_score INTEGER,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS interview_rounds (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        round_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        score INTEGER,
        rubric_scores TEXT,
        round_feedback TEXT,
        started_at INTEGER,
        completed_at INTEGER
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        sender TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS candidate_answers (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        question_id TEXT,
        question_text TEXT NOT NULL,
        answer_text TEXT NOT NULL,
        evaluation_score INTEGER,
        rubric_breakdown TEXT,
        strengths TEXT,
        weaknesses TEXT,
        feedback TEXT,
        follow_up_asked TEXT,
        follow_up_answer TEXT,
        follow_up_evaluation TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS code_submissions (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        problem_id TEXT NOT NULL REFERENCES coding_problems(id),
        language TEXT NOT NULL,
        code TEXT NOT NULL,
        status TEXT NOT NULL,
        passed_tests INTEGER NOT NULL DEFAULT 0,
        total_tests INTEGER NOT NULL DEFAULT 0,
        runtime_ms REAL,
        memory_kb INTEGER,
        compile_output TEXT,
        error_message TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS execution_results (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES code_submissions(id),
        test_case_id TEXT NOT NULL REFERENCES test_cases(id),
        passed INTEGER NOT NULL,
        actual_output TEXT,
        expected_output TEXT,
        execution_time_ms REAL,
        memory_kb INTEGER,
        error TEXT
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS interview_reports (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        overall_score INTEGER NOT NULL,
        round_scores TEXT NOT NULL,
        technical_strengths TEXT NOT NULL,
        areas_for_improvement TEXT NOT NULL,
        communication_assessment TEXT NOT NULL,
        coding_assessment TEXT NOT NULL,
        seven_day_plan TEXT NOT NULL,
        readiness_summary TEXT NOT NULL,
        readiness_level TEXT NOT NULL,
        markdown_export TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        itemId TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    await sqliteClient.execute(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Auto-seed question bank and coding challenges if DB is newly created
    const { autoSeedIfEmpty } = await import("./auto-seed");
    await autoSeedIfEmpty();

    initialized = true;
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}
