/**
 * Server-side harness adapter for method-based and standard I/O execution.
 */

export interface TestHarnessOptions {
  language: "java" | "python" | "cpp";
  code: string;
  problemSlug?: string;
}

export function prepareExecutionSource(options: TestHarnessOptions): string {
  const { language, code } = options;
  const trimmed = code.trim();

  if (language === "java") {
    // If user provided a complete program with public static void main, ensure it is in a public class Main
    if (trimmed.includes("public static void main")) {
      // If user named the class something other than Main, rename the main class to Main
      if (!trimmed.includes("class Main") && !trimmed.includes("public class Main")) {
        return trimmed.replace(/public\s+class\s+([A-Za-z0-9_]+)/, "public class Main");
      }
      return trimmed;
    }

    // If method-based submission (e.g., class Solution)
    return `
import java.io.*;
import java.util.*;

${trimmed}

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);
        Solution solution = new Solution();
        
        // Execute input lines if available
        if (scanner.hasNextLine()) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine().trim();
                if (line.isEmpty()) continue;
                // Method problems typically receive space or comma separated tokens
                // Candidate code can also be invoked or executed via stdin
            }
        }
    }
}
`;
  }

  if (language === "python") {
    return trimmed;
  }

  if (language === "cpp") {
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
