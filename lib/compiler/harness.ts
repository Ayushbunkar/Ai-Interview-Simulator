/**
 * Server-side harness adapter for method-based and standard I/O execution.
 */
import { PROBLEM_DRIVERS, getUniversalDriverJava, getUniversalDriverPython } from "./drivers";

export interface TestHarnessOptions {
  language: "java" | "python" | "cpp";
  code: string;
  problemSlug?: string;
}

export function prepareExecutionSource(options: TestHarnessOptions): string {
  const { language, code, problemSlug } = options;
  const trimmed = code.trim();
  const slug = problemSlug || "";

  if (language === "java") {
    // If user provided a complete standalone program with public static void main, run as-is
    if (trimmed.includes("public static void main") || trimmed.includes("static void main")) {
      if (!trimmed.includes("class Main") && !trimmed.includes("public class Main")) {
        return trimmed.replace(/public\s+class\s+([A-Za-z0-9_]+)/, "public class Main");
      }
      return trimmed;
    }

    // Method-based submission (LeetCode class Solution)
    // 1. Ensure public class Solution is non-public so public class Main can be the file entry
    let cleanUserCode = trimmed.replace(/public\s+class\s+Solution/, "class Solution");
    if (!cleanUserCode.includes("class Solution") && !cleanUserCode.includes("class LRUCache") && !cleanUserCode.includes("class MedianFinder")) {
      cleanUserCode = `class Solution {\n${cleanUserCode}\n}`;
    }

    const driver = PROBLEM_DRIVERS[slug]?.java || getUniversalDriverJava();
    return `import java.io.*;\nimport java.util.*;\n\n${cleanUserCode}\n\n${driver}`;
  }

  if (language === "python") {
    if (trimmed.includes("__main__")) {
      return trimmed;
    }

    const driver = PROBLEM_DRIVERS[slug]?.python || getUniversalDriverPython();
    return `import sys\nfrom typing import List, Optional\n\n${trimmed}\n\n${driver}`;
  }

  if (language === "cpp") {
    if (/int\s+main\s*\(/.test(trimmed)) {
      return trimmed;
    }

    const driver = PROBLEM_DRIVERS[slug]?.cpp;
    if (driver) {
      let headers = "";
      if (!trimmed.includes("<iostream>")) {
        headers = "#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n#include <unordered_map>\nusing namespace std;\n\n";
      }
      return `${headers}${trimmed}\n\n${driver}`;
    }
    return trimmed;
  }

  return trimmed;
}

export function normalizeOutput(output?: string | null): string {
  if (!output) return "";
  return output
    .replace(/\r\n/g, "\n")
    .trim();
}

export function compareOutputs(actual?: string | null, expected?: string | null): boolean {
  const normActual = normalizeOutput(actual);
  const normExpected = normalizeOutput(expected);
  return normActual === normExpected;
}
