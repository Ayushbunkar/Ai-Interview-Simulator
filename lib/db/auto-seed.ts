import { pool } from "./index";
import { getActiveDatabaseUrl } from "../config/cloud-fallback";

import backendApi from "@/data/questions/backend_api.json";
import behavioral from "@/data/questions/behavioral.json";
import dbmsSql from "@/data/questions/dbms_sql.json";
import dsaConcepts from "@/data/questions/dsa_concepts.json";
import javaOop from "@/data/questions/java_oop.json";
import networks from "@/data/questions/networks.json";
import osQuestions from "@/data/questions/os.json";
import systemDesign from "@/data/questions/system_design.json";

import easyCoding from "@/data/coding/easy.json";
import mediumCoding from "@/data/coding/medium.json";
import hardCoding from "@/data/coding/hard.json";

export async function autoSeedIfEmpty() {
  const activeConn = getActiveDatabaseUrl();
  if (!activeConn) return;
  try {
    const qCountRes = await pool.query("SELECT COUNT(*) as count FROM questions;");
    const count = parseInt(qCountRes.rows[0]?.count || "0", 10);
    if (count > 0) {
      return;
    }

    console.log("Neon database tables are empty. Auto-seeding initial question bank and coding problems...");

    const allQuestions = [
      ...backendApi,
      ...behavioral,
      ...dbmsSql,
      ...dsaConcepts,
      ...javaOop,
      ...networks,
      ...osQuestions,
      ...systemDesign,
    ];

    for (const q of allQuestions) {
      await pool.query({
        text: `INSERT INTO questions (
          id, category, topic, difficulty, company_tags, question_text, expected_answer, explanation, follow_ups, rubric_focus, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (id) DO NOTHING`,
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
          (q as any).rubricFocus || null,
        ],
      });
    }

    const allCoding = [...easyCoding, ...mediumCoding, ...hardCoding];
    for (const p of allCoding) {
      await pool.query({
        text: `INSERT INTO coding_problems (
          id, title, slug, difficulty, topic_tags, description, input_format, output_format, constraints, examples,
          starter_code_java, starter_code_python, starter_code_cpp,
          reference_solution_java, reference_solution_python, reference_solution_cpp,
          time_complexity, space_complexity, hints, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (id) DO NOTHING`,
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
        ],
      });

      if (Array.isArray(p.testCases)) {
        for (let i = 0; i < p.testCases.length; i++) {
          const tc = p.testCases[i];
          await pool.query({
            text: `INSERT INTO test_cases (
              id, problem_id, input, expected_output, is_hidden, explanation, order_index
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING`,
            values: [
              tc.id || `${p.id}_tc_${i}`,
              p.id,
              tc.input,
              tc.expectedOutput,
              Boolean(tc.isHidden),
              (tc as any).explanation || null,
              i,
            ],
          });
        }
      }
    }

    console.log(`Auto-seeded ${allQuestions.length} questions and ${allCoding.length} coding problems successfully into Neon.`);
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
}
