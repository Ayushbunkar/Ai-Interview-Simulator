import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseResumeStructured } from "../lib/intelligence/resume-parser.ts";
import { calculateATSScore } from "../lib/intelligence/ats-calculator.ts";

describe("ATS Score & Resume Intelligence Acceptance Suite", () => {

  test("1. Comprehensive resume receives strong ATS score with metric breakdown", () => {
    const resume = `
Ayush Bunkar
Email: ayush@example.com | Phone: (555) 123-4567 | github.com/ayushbunkar
Full Stack Software Engineer

TECHNICAL SKILLS:
- Languages: Java, Python, TypeScript, SQL
- Frameworks: Spring Boot, React, Next.js, Node.js, Tailwind CSS
- Databases: PostgreSQL, MongoDB, Redis
- Cloud & Tools: Docker, Git, REST APIs, Microservices, JUnit

EXPERIENCE & PROJECTS:
FinTech High-Throughput Payment Engine
- Architected and engineered a resilient microservices backend using Spring Boot and PostgreSQL.
- Optimized query execution with Redis caching, reducing API latency by 45% under 10k requests/sec.
- Implemented JWT authentication and distributed database transactions with optimistic locking.

AI Document Search & Retrieval System
- Developed vector retrieval pipeline using Python and LangChain.
- Scaled embedding indexing across 500k documents, improving retrieval accuracy by 30%.

EDUCATION:
Bachelor of Technology in Computer Science & Engineering
`;

    const parsed = parseResumeStructured(resume);
    assert.equal(parsed.success, true);

    const ats = calculateATSScore({
      rawResumeText: resume,
      profile: parsed.profile,
      targetRole: "Java Backend Engineer",
    });

    assert.ok(ats.overallScore >= 75, `Expected high ATS score >= 75, got ${ats.overallScore}`);
    assert.ok(ats.breakdown.skillsKeywordScore >= 20, "Skills keyword score should be high");
    assert.ok(ats.breakdown.actionImpactScore >= 15, "Action impact score should be high");
    assert.ok(ats.breakdown.formattingStructureScore >= 15, "Structure score should be high");
    assert.ok(ats.quantifiedMetricsCount >= 2, "Quantified metrics (45%, 10k, 500k, 30%) should be detected");
    assert.ok(ats.strengths.length >= 2, "Strengths must be populated");
  });

  test("2. Sparse resume receives appropriate feedback and identifies missing keywords", () => {
    const sparseResume = `
John Doe
I know some coding.
I made a website with HTML and JavaScript.
`;

    const parsed = parseResumeStructured(sparseResume);
    const ats = calculateATSScore({
      rawResumeText: sparseResume,
      profile: parsed.profile,
      targetRole: "Java Backend Developer",
    });

    assert.ok(ats.overallScore < 60, "Sparse resume should receive lower score");
    assert.equal(ats.rating, "Needs Optimization");
    assert.ok(ats.improvements.length > 0, "Actionable improvements must be offered");
    assert.ok(ats.criticalMissingKeywords.includes("JAVA"), "Must identify missing Java keyword for Java Backend role");
  });

  test("3. Scanned or empty resume is rejected cleanly", () => {
    const emptyText = "";
    const parsed = parseResumeStructured(emptyText);
    assert.equal(parsed.success, false);
    assert.equal(parsed.isScannedPdf, true);
  });
});
