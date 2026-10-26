import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL || "file:interviewforge.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function seed() {
  console.log(`Connecting to database at ${dbUrl}...`);

  // Ensure tables exist
  await client.execute(`
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

  await client.execute(`
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

  await client.execute(`
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

  const now = Date.now();

  // 1. Seed Questions
  const qFiles = [
    "data/questions/java_oop.json",
    "data/questions/dbms_sql.json",
    "data/questions/os.json",
    "data/questions/networks.json",
    "data/questions/dsa_concepts.json",
    "data/questions/backend_api.json",
    "data/questions/system_design.json",
    "data/questions/behavioral.json"
  ];

  let totalQuestions = 0;
  for (const f of qFiles) {
    if (!fs.existsSync(f)) continue;
    const items = JSON.parse(fs.readFileSync(f, "utf-8"));
    for (const q of items) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO questions (
          id, category, topic, difficulty, company_tags, question_text, expected_answer, explanation, follow_ups, rubric_focus, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          q.id,
          q.category,
          q.topic,
          q.difficulty,
          JSON.stringify(q.companyTags),
          q.questionText,
          q.expectedAnswer,
          q.explanation,
          JSON.stringify(q.followUps),
          q.rubricFocus || null,
          now
        ]
      });
      totalQuestions++;
    }
  }
  console.log(`Successfully seeded ${totalQuestions} questions into database.`);

  // 2. Seed Coding Problems & Test Cases
  const cFiles = [
    "data/coding/easy.json",
    "data/coding/medium.json",
    "data/coding/hard.json"
  ];

  let totalProblems = 0;
  let totalTestCases = 0;

  for (const f of cFiles) {
    if (!fs.existsSync(f)) continue;
    const problems = JSON.parse(fs.readFileSync(f, "utf-8"));
    for (const p of problems) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO coding_problems (
          id, title, slug, difficulty, topic_tags, description, input_format, output_format,
          constraints, examples, starter_code_java, starter_code_python, starter_code_cpp,
          reference_solution_java, reference_solution_python, reference_solution_cpp,
          time_complexity, space_complexity, hints, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id,
          p.title,
          p.slug,
          p.difficulty,
          JSON.stringify(p.topicTags),
          p.description,
          p.inputFormat,
          p.outputFormat,
          JSON.stringify(p.constraints),
          JSON.stringify(p.examples),
          p.starterCodeJava,
          p.starterCodePython,
          p.starterCodeCpp,
          p.referenceSolutionJava,
          p.referenceSolutionPython,
          p.referenceSolutionCpp,
          p.timeComplexity,
          p.spaceComplexity,
          JSON.stringify(p.hints),
          now
        ]
      });
      totalProblems++;

      if (p.testCases && p.testCases.length > 0) {
        for (let idx = 0; idx < p.testCases.length; idx++) {
          const tc = p.testCases[idx];
          await client.execute({
            sql: `INSERT OR REPLACE INTO test_cases (
              id, problem_id, input, expected_output, is_hidden, explanation, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              tc.id,
              p.id,
              tc.input,
              tc.expectedOutput,
              tc.isHidden ? 1 : 0,
              tc.explanation || null,
              idx
            ]
          });
          totalTestCases++;
        }
      }
    }
  }

  console.log(`Successfully seeded ${totalProblems} coding problems and ${totalTestCases} test cases.`);
  console.log("Database seed completed successfully!");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
