import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { getActiveDatabaseUrl } from "../config/cloud-fallback";

function loadLocalEnvIfMissing() {
  if (typeof window !== "undefined") return;
  if (typeof process === "undefined" || !process.cwd) return;
  if (process.env.DATABASE_URL) return;

  try {
    // Dynamic import/require to prevent client-side bundler from choking on 'fs'
    const fs = eval("require")("fs");
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const [key, ...vals] = trimmed.split("=");
            if (key && vals.length && !process.env[key.trim()]) {
              process.env[key.trim()] = vals.join("=").trim();
            }
          }
        } catch {}
      }
    }
  } catch {}
}
loadLocalEnvIfMissing();

const connectionString = getActiveDatabaseUrl();

export const pool = new Pool({ connectionString });
export const sqliteClient = pool; // backwards-compatible alias
export const db = drizzle(pool, { schema });

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;
  const activeConn = getActiveDatabaseUrl();
  if (!activeConn) {
    // Neon database URL is not configured. Running in offline/fallback mode.
    initialized = true;
    return;
  }
  try {
    // 1. Ensure all tables exist in Neon PostgreSQL
    await pool.query(`
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS test_cases (
        id TEXT PRIMARY KEY,
        problem_id TEXT NOT NULL REFERENCES coding_problems(id),
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        explanation TEXT,
        order_index INTEGER NOT NULL
      );

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
        is_paused BOOLEAN NOT NULL DEFAULT FALSE,
        started_at TIMESTAMP,
        paused_at TIMESTAMP,
        completed_at TIMESTAMP,
        total_score INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS interview_rounds (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        round_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        score INTEGER,
        rubric_scores TEXT,
        round_feedback TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        sender TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      );

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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_results (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES code_submissions(id),
        test_case_id TEXT NOT NULL REFERENCES test_cases(id),
        passed BOOLEAN NOT NULL,
        actual_output TEXT,
        expected_output TEXT,
        execution_time_ms REAL,
        memory_kb INTEGER,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS evaluations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        round_number INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        rubric_scores TEXT NOT NULL,
        strengths TEXT NOT NULL,
        improvements TEXT NOT NULL,
        detailed_notes TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        item_id TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS interview_mode_variant TEXT NOT NULL DEFAULT 'full_mock';
      ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS resume_profile_id TEXT;

      CREATE TABLE IF NOT EXISTS resume_profiles (
        id TEXT PRIMARY KEY,
        candidate_name TEXT,
        target_role TEXT,
        experience_level TEXT,
        raw_resume_text TEXT,
        raw_job_description TEXT,
        extracted_skills TEXT NOT NULL DEFAULT '[]',
        extracted_projects TEXT NOT NULL DEFAULT '[]',
        extracted_technologies TEXT NOT NULL DEFAULT '[]',
        extracted_topics TEXT NOT NULL DEFAULT '[]',
        job_requirements TEXT NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS candidate_skills_profile (
        id TEXT PRIMARY KEY,
        skill_category TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_assessed',
        score INTEGER,
        times_assessed INTEGER NOT NULL DEFAULT 0,
        times_correct INTEGER NOT NULL DEFAULT 0,
        evidence_notes TEXT NOT NULL DEFAULT '[]',
        last_assessed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS revision_queue (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        question_id TEXT,
        problem_id TEXT,
        title TEXT NOT NULL,
        topic TEXT NOT NULL,
        skill_category TEXT NOT NULL,
        reason TEXT NOT NULL,
        evidence_context TEXT NOT NULL,
        reference_notes TEXT NOT NULL,
        repetition_count INTEGER NOT NULL DEFAULT 0,
        interval_days INTEGER NOT NULL DEFAULT 1,
        ease_factor REAL NOT NULL DEFAULT 2.5,
        next_review_due TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS revision_attempts (
        id TEXT PRIMARY KEY,
        revision_item_id TEXT NOT NULL REFERENCES revision_queue(id),
        candidate_response TEXT NOT NULL,
        score INTEGER NOT NULL,
        feedback TEXT NOT NULL,
        reviewed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        model_or_lang TEXT NOT NULL,
        status TEXT NOT NULL,
        response_time_ms INTEGER NOT NULL,
        prompt_tokens_est INTEGER NOT NULL DEFAULT 0,
        completion_tokens_est INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coding_steps_log (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        problem_id TEXT NOT NULL REFERENCES coding_problems(id),
        step_type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE interview_reports ADD COLUMN IF NOT EXISTS resume_assessment_report TEXT;

      ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS expected_concepts TEXT;
      ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS demonstrated_concepts TEXT;
      ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS missing_concepts TEXT;
      ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS improved_answer_outline TEXT;
      ALTER TABLE candidate_answers ADD COLUMN IF NOT EXISTS confidence_level TEXT;

      CREATE TABLE IF NOT EXISTS interview_blueprints (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES interview_sessions(id),
        resume_profile_id TEXT,
        primary_stack TEXT NOT NULL DEFAULT '[]',
        secondary_skills TEXT NOT NULL DEFAULT '[]',
        high_priority_topics TEXT NOT NULL DEFAULT '[]',
        medium_priority_topics TEXT NOT NULL DEFAULT '[]',
        supporting_fundamentals TEXT NOT NULL DEFAULT '[]',
        resume_claims TEXT NOT NULL DEFAULT '[]',
        primary_language TEXT NOT NULL DEFAULT 'java',
        planned_distribution TEXT NOT NULL DEFAULT '{}',
        raw_blueprint_json TEXT NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Check if questions are seeded, if not auto-seed
    const countRes = await pool.query("SELECT COUNT(*) as count FROM questions;");
    const count = parseInt(countRes.rows[0]?.count || "0", 10);
    if (count === 0) {
      const { autoSeedIfEmpty } = await import("./auto-seed");
      await autoSeedIfEmpty();
    }

    initialized = true;
  } catch (err) {
    console.error("Neon database initialization error:", err);
  }
}
