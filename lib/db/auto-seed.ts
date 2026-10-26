import { sqliteClient } from "./index";

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
  try {
    const qCountRes = await sqliteClient.execute("SELECT COUNT(*) as count FROM questions;");
    const count = Number(qCountRes.rows[0]?.count ?? 0);
    if (count > 0) {
      return;
    }

    console.log("Database tables are empty. Auto-seeding initial question bank and coding problems...");

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
      await sqliteClient.execute({
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
          (q as any).rubricFocus || null,
          Date.now(),
        ],
      });
    }

    const allCoding = [...easyCoding, ...mediumCoding, ...hardCoding];
    for (const p of allCoding) {
      await sqliteClient.execute({
        sql: `INSERT OR REPLACE INTO coding_problems (
          id, title, slug, difficulty, topic_tags, description, input_format, output_format, constraints, examples,
          starter_code_java, starter_code_python, starter_code_cpp,
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
          Date.now(),
        ],
      });

      if (Array.isArray(p.testCases)) {
        for (let i = 0; i < p.testCases.length; i++) {
          const tc = p.testCases[i];
          await sqliteClient.execute({
            sql: `INSERT OR REPLACE INTO test_cases (
              id, problem_id, input, expected_output, is_hidden, explanation, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              tc.id || `${p.id}_tc_${i}`,
              p.id,
              tc.input,
              tc.expectedOutput,
              tc.isHidden ? 1 : 0,
              (tc as any).explanation || null,
              i,
            ],
          });
        }
      }
    }

    console.log(`Auto-seeded ${allQuestions.length} questions and ${allCoding.length} coding problems successfully.`);
  } catch (err) {
    console.error("Auto-seed error:", err);
  }
}
