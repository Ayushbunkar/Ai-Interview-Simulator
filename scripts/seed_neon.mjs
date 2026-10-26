import fs from "fs";
import { Pool } from "@neondatabase/serverless";

const connectionString = "postgresql://neondb_owner:npg_tTLgX27mQpyJ@ep-red-cloud-b5l16io3-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

async function seedNeon() {
  console.log("Seeding Neon database with question bank and coding problems...");

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
      await pool.query({
        text: `INSERT INTO questions (
          id, category, topic, difficulty, company_tags, question_text, expected_answer, explanation, follow_ups, rubric_focus, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (id) DO UPDATE SET
          question_text = EXCLUDED.question_text,
          expected_answer = EXCLUDED.expected_answer,
          explanation = EXCLUDED.explanation`,
        values: [
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
        ]
      });
      totalQuestions++;
    }
  }
  console.log(`Successfully seeded ${totalQuestions} questions into Neon!`);

  // 2. Seed Coding Problems
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
      await pool.query({
        text: `INSERT INTO coding_problems (
          id, title, slug, difficulty, topic_tags, description, input_format, output_format,
          constraints, examples, starter_code_java, starter_code_python, starter_code_cpp,
          reference_solution_java, reference_solution_python, reference_solution_cpp,
          time_complexity, space_complexity, hints, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description`,
        values: [
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
        ]
      });
      totalProblems++;

      if (p.testCases && p.testCases.length > 0) {
        for (let idx = 0; idx < p.testCases.length; idx++) {
          const tc = p.testCases[idx];
          await pool.query({
            text: `INSERT INTO test_cases (
              id, problem_id, input, expected_output, is_hidden, explanation, order_index
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              input = EXCLUDED.input,
              expected_output = EXCLUDED.expected_output`,
            values: [
              tc.id,
              p.id,
              tc.input,
              tc.expectedOutput,
              Boolean(tc.isHidden),
              tc.explanation || null,
              idx,
            ]
          });
          totalTestCases++;
        }
      }
    }
  }
  console.log(`Successfully seeded ${totalProblems} coding problems and ${totalTestCases} test cases into Neon!`);
  await pool.end();
}

seedNeon().catch(console.error);
