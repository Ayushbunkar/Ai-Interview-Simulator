import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { evaluateSpokenAnswer } from "../lib/assessment/speech-articulation-evaluator.ts";

test("Speech Drill 700 - Question Bank Data Integrity", async (t) => {
  const filePath = path.resolve(process.cwd(), "lib/data/question-bank-700.json");
  assert.ok(fs.existsSync(filePath), "question-bank-700.json file must exist");

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  assert.equal(data.length, 700, "Must contain exactly 700 questions");

  const categories = {};
  data.forEach((q, idx) => {
    assert.ok(q.id, `Question ${idx} must have an id`);
    assert.ok(q.catId >= 1 && q.catId <= 14, `Question ${idx} catId must be between 1 and 14`);
    assert.ok(q.category, `Question ${idx} must have a category name`);
    assert.ok(q.question, `Question ${idx} must have question text`);
    assert.ok(q.modelAnswer && q.modelAnswer.length > 20, `Question ${idx} must have a detailed model answer`);
    assert.ok(Array.isArray(q.keyPoints) && q.keyPoints.length >= 2, `Question ${idx} must have keyPoints`);
    assert.ok(q.difficulty, `Question ${idx} must have difficulty`);

    categories[q.category] = (categories[q.category] || 0) + 1;
  });

  const catNames = Object.keys(categories);
  assert.equal(catNames.length, 14, "Must have exactly 14 distinct categories");

  for (const [cat, count] of Object.entries(categories)) {
    assert.equal(count, 50, `Category ${cat} must have exactly 50 questions`);
  }
});

test("Speech Drill 700 - Articulation & Speech Evaluator", async (t) => {
  const sampleEvaluation = await evaluateSpokenAnswer({
    transcript: "Basically um Java is platform independent because it compiles code into bytecode which runs on the JVM you know.",
    question: "Why is Java platform-independent?",
    modelAnswer: "Java is platform-independent because source code is compiled into bytecode executed by the JVM.",
    keyPoints: ["Bytecode execution", "JVM abstraction layer", "Write Once, Run Anywhere"],
    audioDurationSeconds: 10,
    mode: "initial",
  });

  assert.ok(sampleEvaluation.overallScore >= 0 && sampleEvaluation.overallScore <= 100);
  assert.ok(sampleEvaluation.articulationScore >= 0 && sampleEvaluation.articulationScore <= 100);
  assert.ok(sampleEvaluation.fluencyScore >= 0 && sampleEvaluation.fluencyScore <= 100);
  assert.ok(sampleEvaluation.grammarScore >= 0 && sampleEvaluation.grammarScore <= 100);
  assert.ok(sampleEvaluation.contentAccuracyScore >= 0 && sampleEvaluation.contentAccuracyScore <= 100);

  // Verify filler words detection
  assert.ok(sampleEvaluation.fillerWordCount >= 2, "Must detect 'basically' and 'um'");
  const fillerWords = sampleEvaluation.fillerWordsFound.map(f => f.word);
  assert.ok(fillerWords.includes("basically") || fillerWords.includes("um"));

  // Verify WPM calculation
  assert.ok(sampleEvaluation.wordsPerMinute > 0, "Must calculate WPM");
  assert.ok(sampleEvaluation.pacingFeedback, "Must provide pacing feedback");

  // Verify keypoint matching
  assert.ok(sampleEvaluation.coveredKeyPoints.length > 0, "Should detect covered keypoint");

  // Re-speak improvement test
  const respeakEvaluation = await evaluateSpokenAnswer({
    transcript: "Java is platform-independent because source code is compiled into bytecode executed by the JVM, achieving Write Once Run Anywhere.",
    question: "Why is Java platform-independent?",
    modelAnswer: "Java is platform-independent because source code is compiled into bytecode executed by the JVM.",
    keyPoints: ["Bytecode execution", "JVM abstraction layer", "Write Once, Run Anywhere"],
    audioDurationSeconds: 8,
    mode: "re-speak",
    previousScore: sampleEvaluation.overallScore,
  });

  assert.ok(respeakEvaluation.overallScore >= sampleEvaluation.overallScore, "Re-speaking clean answer should score higher or equal");
  assert.equal(respeakEvaluation.fillerWordCount, 0, "Clean re-speak should have 0 fillers");
  assert.ok(respeakEvaluation.scoreDelta !== undefined, "Score delta must be reported");
});
