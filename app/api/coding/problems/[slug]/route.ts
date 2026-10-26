import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { codingProblems, testCases, bookmarks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { STATIC_CODING_PROBLEMS } from "@/lib/fallback/data-source";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug || "two-sum";
    let p: any = null;
    let visibleTests: any[] = [];
    let isBm = false;

    if (process.env.DATABASE_URL) {
      try {
        await ensureDbInitialized();
        const [found] = await db
          .select()
          .from(codingProblems)
          .where(eq(codingProblems.slug, slug));
        p = found;

        if (p) {
          // Only fetch VISIBLE test cases! Never expose hidden tests
          visibleTests = await db
            .select({
              id: testCases.id,
              input: testCases.input,
              expectedOutput: testCases.expectedOutput,
              explanation: testCases.explanation,
              orderIndex: testCases.orderIndex,
            })
            .from(testCases)
            .where(and(eq(testCases.problemId, p.id), eq(testCases.isHidden, false)));

          const [bm] = await db
            .select()
            .from(bookmarks)
            .where(and(eq(bookmarks.itemType, "problem"), eq(bookmarks.itemId, p.id)));
          isBm = Boolean(bm);
        }
      } catch (dbErr) {
        console.warn("Neon DB coding problem by slug query error, falling back to static problem:", dbErr);
        p = null;
      }
    }

    // Static fallback if not found in DB or DB unreachable
    if (!p) {
      const staticProblem = STATIC_CODING_PROBLEMS.find(cp => cp.slug === slug) || STATIC_CODING_PROBLEMS[0];
      if (!staticProblem) {
        return NextResponse.json({ error: "Coding problem not found" }, { status: 404 });
      }

      return NextResponse.json({
        problem: {
          id: staticProblem.id,
          title: staticProblem.title,
          slug: staticProblem.slug,
          difficulty: staticProblem.difficulty,
          topicTags: staticProblem.topicTags,
          description: staticProblem.description,
          inputFormat: staticProblem.inputFormat,
          outputFormat: staticProblem.outputFormat,
          constraints: staticProblem.constraints,
          examples: staticProblem.examples,
          hints: staticProblem.hints,
          starterCode: {
            java: staticProblem.starterCodeJava,
            python: staticProblem.starterCodePython,
            cpp: staticProblem.starterCodeCpp,
          },
          timeComplexity: staticProblem.timeComplexity,
          spaceComplexity: staticProblem.spaceComplexity,
          visibleTestCases: (staticProblem.testCases || [])
            .filter(tc => !tc.isHidden)
            .map((tc, idx) => ({
              id: tc.id || `tc-${idx}`,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              explanation: tc.explanation,
              orderIndex: idx,
            })),
          isBookmarked: false,
        },
      });
    }

    let topicTags: string[] = [];
    try {
      topicTags = typeof p.topicTags === "string" ? JSON.parse(p.topicTags || "[]") : p.topicTags;
    } catch {
      topicTags = [];
    }

    let constraints: string[] = [];
    try {
      constraints = typeof p.constraints === "string" ? JSON.parse(p.constraints || "[]") : p.constraints;
    } catch {
      constraints = [];
    }

    let examples: any[] = [];
    try {
      examples = typeof p.examples === "string" ? JSON.parse(p.examples || "[]") : p.examples;
    } catch {
      examples = [];
    }

    let hints: string[] = [];
    try {
      hints = typeof p.hints === "string" ? JSON.parse(p.hints || "[]") : p.hints;
    } catch {
      hints = [];
    }

    return NextResponse.json({
      problem: {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topicTags,
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints,
        examples,
        hints,
        starterCode: {
          java: p.starterCodeJava,
          python: p.starterCodePython,
          cpp: p.starterCodeCpp,
        },
        timeComplexity: p.timeComplexity,
        spaceComplexity: p.spaceComplexity,
        visibleTestCases: visibleTests,
        isBookmarked: isBm,
      },
    });
  } catch (error: any) {
    console.error("Critical error in /api/coding/problems/[slug]:", error);
    const fallback = STATIC_CODING_PROBLEMS[0];
    return NextResponse.json({
      problem: {
        id: fallback.id,
        title: fallback.title,
        slug: fallback.slug,
        difficulty: fallback.difficulty,
        topicTags: fallback.topicTags,
        description: fallback.description,
        inputFormat: fallback.inputFormat,
        outputFormat: fallback.outputFormat,
        constraints: fallback.constraints,
        examples: fallback.examples,
        hints: fallback.hints,
        starterCode: {
          java: fallback.starterCodeJava,
          python: fallback.starterCodePython,
          cpp: fallback.starterCodeCpp,
        },
        timeComplexity: fallback.timeComplexity,
        spaceComplexity: fallback.spaceComplexity,
        visibleTestCases: (fallback.testCases || []).filter(tc => !tc.isHidden),
        isBookmarked: false,
      },
    });
  }
}
