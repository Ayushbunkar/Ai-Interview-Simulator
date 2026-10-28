import { db, ensureDbInitialized } from "../db";
import { codingProblems } from "../db/schema";
import { STATIC_CODING_PROBLEMS, CodingProblemData } from "../fallback/data-source";
import { eq, notInArray } from "drizzle-orm";

// Company-specific curated problem slugs based on real placement trends
export const COMPANY_CODING_SLUGS: Record<string, string[]> = {
  TCS: [
    // Easy (TCS Ninja / Foundation)
    "two-sum",
    "valid-palindrome",
    "valid-parentheses",
    "best-time-to-buy-and-sell-stock",
    "binary-search",
    "contains-duplicate",
    "valid-anagram",
    "maximum-subarray-kadanes",
    "climbing-stairs",
    "reverse-string",
    "merge-two-sorted-lists",
    "single-number",
    "majority-element",
    "missing-number",
    "move-zeroes",
    "reverse-linked-list",
    "intersection-of-two-arrays",
    // Medium (TCS Digital / Prime)
    "longest-substring-without-repeating-characters",
    "3sum",
    "container-with-most-water",
    "longest-palindromic-substring",
    "product-of-array-except-self",
    "search-in-rotated-sorted-array",
    "subsets",
    "spiral-matrix",
  ],
  Capgemini: [
    "valid-palindrome",
    "reverse-string",
    "valid-anagram",
    "move-zeroes",
    "missing-number",
    "single-number",
    "binary-search",
    "contains-duplicate",
    "climbing-stairs",
    "maximum-subarray-kadanes",
    "best-time-to-buy-and-sell-stock",
    "valid-parentheses",
    "two-sum",
    "longest-palindromic-substring",
    "longest-substring-without-repeating-characters",
    "3sum",
    "container-with-most-water",
    "search-in-rotated-sorted-array",
    "rotate-image",
  ],
  "Service-Based General": [
    "two-sum",
    "valid-palindrome",
    "valid-parentheses",
    "best-time-to-buy-and-sell-stock",
    "binary-search",
    "contains-duplicate",
    "valid-anagram",
    "maximum-subarray-kadanes",
    "climbing-stairs",
    "reverse-string",
    "merge-two-sorted-lists",
    "single-number",
    "majority-element",
    "missing-number",
    "move-zeroes",
    "reverse-linked-list",
    "intersection-of-two-arrays",
    "longest-substring-without-repeating-characters",
    "3sum",
    "product-of-array-except-self",
  ],
  "Product-Based Engineering": [
    "3sum",
    "container-with-most-water",
    "longest-palindromic-substring",
    "group-anagrams",
    "top-k-frequent-elements",
    "product-of-array-except-self",
    "search-in-rotated-sorted-array",
    "coin-change",
    "longest-increasing-subsequence",
    "word-break",
    "number-of-islands",
    "course-schedule",
    "clone-graph",
    "lru-cache",
    "merge-intervals",
    "trapping-rain-water",
    "merge-k-sorted-lists",
    "sliding-window-maximum",
    "median-of-two-sorted-arrays",
  ],
  "Startup Fast-Paced": [
    "lru-cache",
    "merge-intervals",
    "group-anagrams",
    "top-k-frequent-elements",
    "number-of-islands",
    "longest-substring-without-repeating-characters",
    "best-time-to-buy-and-sell-stock",
    "subsets",
    "valid-parentheses",
    "two-sum",
    "container-with-most-water",
  ],
  "Java / Backend Specialist": [
    "lru-cache",
    "top-k-frequent-elements",
    "group-anagrams",
    "course-schedule",
    "longest-substring-without-repeating-characters",
    "merge-two-sorted-lists",
    "reverse-linked-list",
    "binary-search",
    "two-sum",
    "merge-intervals",
  ],
};

export interface FormattedCodingProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topicTags: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  hints: string[];
  starterCodeJava: string;
  starterCodePython: string;
  starterCodeCpp: string;
  starterCode: {
    java: string;
    python: string;
    cpp: string;
  };
  visibleTestCases: {
    id?: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
  }[];
  timeComplexity?: string;
  spaceComplexity?: string;
  companyTags?: string[];
}

export function formatProblemRecord(p: any): FormattedCodingProblem {
  const parseJson = (val: any, fallback: any = []) => {
    if (!val) return fallback;
    if (typeof val !== "string") return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  };

  const topicTags = parseJson(p.topicTags || p.topic_tags, []);
  const constraints = parseJson(p.constraints, []);
  const examples = parseJson(p.examples, []);
  const hints = parseJson(p.hints, []);
  const testCases = parseJson(p.testCases || p.test_cases, []);

  const visibleTestCases = examples.length > 0
    ? examples.map((ex: any, idx: number) => ({
        id: `example-${idx + 1}`,
        input: ex.input,
        expectedOutput: ex.output,
        explanation: ex.explanation,
      }))
    : (testCases.filter((tc: any) => !tc.isHidden).length > 0
      ? testCases.filter((tc: any) => !tc.isHidden)
      : [{ id: "tc-default", input: "", expectedOutput: "" }]);

  const javaCode = p.starterCodeJava || p.starter_code_java || "";
  const pyCode = p.starterCodePython || p.starter_code_python || "";
  const cppCode = p.starterCodeCpp || p.starter_code_cpp || "";

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    topicTags,
    description: p.description,
    inputFormat: p.inputFormat || p.input_format || "",
    outputFormat: p.outputFormat || p.output_format || "",
    constraints,
    examples,
    hints,
    starterCodeJava: javaCode,
    starterCodePython: pyCode,
    starterCodeCpp: cppCode,
    starterCode: {
      java: javaCode,
      python: pyCode,
      cpp: cppCode,
    },
    visibleTestCases,
    timeComplexity: p.timeComplexity || p.time_complexity || "O(N)",
    spaceComplexity: p.spaceComplexity || p.space_complexity || "O(1)",
  };
}

/**
 * Selects a random coding problem tailored specifically to the target company and candidate difficulty.
 * Avoids returning problems previously served if excludeSlugs is provided.
 */
export async function selectRandomCodingProblem(options: {
  companyProfile?: string;
  difficulty?: string;
  excludeSlugs?: string[];
}): Promise<FormattedCodingProblem> {
  const company = options.companyProfile || "TCS";
  const difficulty = options.difficulty || "fresher";
  const exclude = new Set((options.excludeSlugs || []).map(s => s.toLowerCase()));

  // 1. Fetch available problems from database or fallback
  let allProblems: any[] = [];
  try {
    await ensureDbInitialized();
    allProblems = await db.select().from(codingProblems);
  } catch (err) {
    console.warn("DB query failed in selectRandomCodingProblem, falling back to static:", err);
  }

  if (allProblems.length === 0) {
    allProblems = STATIC_CODING_PROBLEMS as any[];
  }

  // 2. Filter out already excluded problems
  let pool = allProblems.filter(p => !exclude.has(p.slug.toLowerCase()) && !exclude.has(p.id.toLowerCase()));
  if (pool.length === 0) {
    // If all excluded, reset to all
    pool = allProblems;
  }

  // 3. Match company preferred slugs
  const companyKey = Object.keys(COMPANY_CODING_SLUGS).find(
    k => k.toLowerCase() === company.toLowerCase() || company.toLowerCase().includes(k.toLowerCase())
  );
  const preferredSlugs = companyKey ? COMPANY_CODING_SLUGS[companyKey] : null;

  let candidates: any[] = [];

  if (preferredSlugs && preferredSlugs.length > 0) {
    const slugSet = new Set(preferredSlugs.map(s => s.toLowerCase()));
    const matchingCompany = pool.filter(p => slugSet.has(p.slug.toLowerCase()));

    if (matchingCompany.length > 0) {
      // Further calibrate by candidate difficulty
      if (company === "TCS" || company === "Capgemini" || company === "Service-Based General") {
        if (difficulty === "fresher" || difficulty === "entry_level") {
          const easyOnly = matchingCompany.filter(p => p.difficulty === "easy");
          candidates = easyOnly.length > 0 ? easyOnly : matchingCompany;
        } else {
          // Experienced TCS / Capgemini: mix of easy and medium
          candidates = matchingCompany;
        }
      } else if (company === "Product-Based Engineering") {
        const medHard = matchingCompany.filter(p => p.difficulty === "medium" || p.difficulty === "hard");
        candidates = medHard.length > 0 ? medHard : matchingCompany;
      } else {
        candidates = matchingCompany;
      }
    }
  }

  // Fallback to pool if company-specific subset didn't yield candidates
  if (candidates.length === 0) {
    if (company === "TCS" || company === "Capgemini" || company === "Service-Based General") {
      const easyPool = pool.filter(p => p.difficulty === "easy");
      candidates = easyPool.length > 0 ? easyPool : pool;
    } else if (company === "Product-Based Engineering") {
      const medHard = pool.filter(p => p.difficulty === "medium" || p.difficulty === "hard");
      candidates = medHard.length > 0 ? medHard : pool;
    } else {
      candidates = pool;
    }
  }

  // 4. RANDOMIZE: Pick a random element from candidate pool
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const chosen = candidates[randomIndex] || allProblems[0];

  return formatProblemRecord(chosen);
}
