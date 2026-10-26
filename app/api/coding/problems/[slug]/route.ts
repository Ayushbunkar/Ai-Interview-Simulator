import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { codingProblems, testCases, bookmarks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await ensureDbInitialized();
    const [p] = await db
      .select()
      .from(codingProblems)
      .where(eq(codingProblems.slug, params.slug));

    if (!p) {
      return NextResponse.json({ error: "Coding problem not found" }, { status: 404 });
    }

    // Only fetch VISIBLE test cases! Never expose hidden tests
    const visibleTests = await db
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

    return NextResponse.json({
      problem: {
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topicTags: JSON.parse(p.topicTags || "[]"),
        description: p.description,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraints: JSON.parse(p.constraints || "[]"),
        examples: JSON.parse(p.examples || "[]"),
        hints: JSON.parse(p.hints || "[]"),
        starterCode: {
          java: p.starterCodeJava,
          python: p.starterCodePython,
          cpp: p.starterCodeCpp,
        },
        timeComplexity: p.timeComplexity,
        spaceComplexity: p.spaceComplexity,
        visibleTestCases: visibleTests,
        isBookmarked: Boolean(bm),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
