import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

// Load .env.local if present
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

import { createSession, submitCandidateAnswer, askInterviewerQuestion, finishSession } from "../lib/interview/engine.ts";
import { getCompilerProvider } from "../lib/compiler/index.ts";

describe("InterviewForge AI — End-to-End Simulation Tests", () => {

  let testSessionId = "";
  let firstQuestionText = "";

  test("1. Successfully configure and create a full 4-round interview session", async () => {
    const session = await createSession({
      title: "TCS Ninja / Digital Simulation",
      targetRole: "Associate Software Engineer",
      companyProfile: "TCS",
      difficulty: "fresher",
      mode: "strict",
      primaryLanguage: "java",
      durationMinutes: 45,
      topicsEmphasized: ["Java Fundamentals & OOP", "SQL & DBMS"],
      resumeText: "Built student management system in Java and MySQL with JDBC connection pooling.",
    });

    assert.ok(session.sessionId, "Session ID should be created");
    assert.ok(session.firstQuestion, "First question should be selected");
    assert.ok(session.firstQuestion.questionText.length > 10);
    testSessionId = session.sessionId;
    firstQuestionText = session.firstQuestion.questionText;
  });

  test("2. Candidate asks clarification interruption — preserves question without scoring penalty", async () => {
    assert.ok(testSessionId);
    const reply = await askInterviewerQuestion({
      sessionId: testSessionId,
      candidateQuestion: "Could you clarify if we should consider multi-threaded synchronization?",
    });

    assert.equal(reply.clarified, true);
    assert.equal(reply.preservesOriginalQuestion, true);
    assert.ok(reply.message.length > 15);
  });

  test("3. Candidate submits answer — gets evaluated against rubric", async () => {
    assert.ok(testSessionId);
    let answerText = "In Java, JDK is the Java Development Kit containing compiler javac and tools. JRE is runtime environment with libraries. JVM executes the bytecode.";
    if (firstQuestionText.toLowerCase().includes("overload") || firstQuestionText.toLowerCase().includes("overrid")) {
      answerText = "Method overloading occurs at compile time when methods have the same name but different parameter lists in the same class. Method overriding occurs at runtime when a subclass provides its own specific implementation of an inherited method with identical name and parameter types. The JVM resolves overridden methods through dynamic method dispatch using the virtual method table (vtable) based on the actual runtime object instance.";
    } else if (firstQuestionText.toLowerCase().includes("connection pool") || firstQuestionText.toLowerCase().includes("jdbc")) {
      answerText = "Connection pooling maintains a reusable cache of active database connections (such as HikariCP) to avoid the expensive TCP and SSL handshake overhead of creating new connections per request.";
    }

    const result = await submitCandidateAnswer({
      sessionId: testSessionId,
      answerText,
    });

    assert.ok(result.evaluation, "Evaluation must exist");
    assert.ok(result.evaluation.score >= 50, `Expected score >= 50, got ${result.evaluation.score}`);
    assert.ok(result.evaluation.rubricScores.length > 0);
    assert.ok(result.interviewerReply.length > 10);
  });

  test("4. Compiler Provider executes code with live OnlineCompiler.io key", async () => {
    const provider = getCompilerProvider();
    assert.equal(provider.isConfigured(), true);

    const res = await provider.execute({
      language: "python",
      sourceCode: "print(int(input()) * 5)",
      stdin: "7\n",
    });

    assert.equal(res.success, true);
    assert.equal(res.stdout?.trim(), "35");
  });

  test("5. Conclude interview and verify persistent report derivation", async () => {
    assert.ok(testSessionId);
    const reportRes = await finishSession(testSessionId);

    assert.ok(reportRes.reportId);
    assert.ok(reportRes.overallScore > 0);
    assert.ok(reportRes.reportData.sevenDayPlan.length === 7, "7-day plan must have 7 days");
    assert.ok(reportRes.markdownExport.includes("InterviewForge AI — Candidate Evaluation Report"));
  });
});
