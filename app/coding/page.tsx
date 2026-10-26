"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Code2,
  Terminal,
  HelpCircle,
  Check,
  Bookmark,
  Share2,
  Layers,
  ArrowLeft,
  Settings as SettingsIcon,
} from "lucide-react";

interface Problem {
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
  starterCode: {
    java: string;
    python: string;
    cpp: string;
  };
  timeComplexity: string;
  spaceComplexity: string;
  visibleTestCases: {
    id: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
  }[];
  isBookmarked?: boolean;
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTimeMs?: number;
  memoryKb?: number;
  error?: string;
  isHidden?: boolean;
}

function CodingArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const querySlug = searchParams.get("slug") || "two-sum";

  const [problemList, setProblemList] = useState<{ id: string; title: string; slug: string; difficulty: string }[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor states
  const [language, setLanguage] = useState<"java" | "python" | "cpp">("java");
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"description" | "hints" | "submissions">("description");
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");

  // Execution states
  const [customStdin, setCustomStdin] = useState("");
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Run / Submit Results
  const [runOutput, setRunOutput] = useState<{
    stdout?: string | null;
    stderr?: string | null;
    compileOutput?: string | null;
    time?: number;
    memory?: number;
    error?: string;
  } | null>(null);

  const [submitResult, setSubmitResult] = useState<{
    status: string;
    passedCount: number;
    totalCount: number;
    runtimeMs?: number;
    memoryKb?: number;
    compileOutput?: string;
    errorMessage?: string;
    testResults: TestResult[];
  } | null>(null);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  // 1. Fetch Problem Catalog
  useEffect(() => {
    fetch("/api/coding/problems")
      .then(r => r.json())
      .then(data => {
        if (data.problems) {
          setProblemList(data.problems);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Selected Problem Details
  useEffect(() => {
    setLoading(true);
    fetch(`/api/coding/problems/${querySlug}`)
      .then(r => {
        if (!r.ok) throw new Error("Problem not found");
        return r.json();
      })
      .then(data => {
        const p: Problem = data.problem;
        setCurrentProblem(p);
        setIsBookmarked(Boolean(p.isBookmarked));
        setRevealedHints([]);

        // Set starter code according to selected language
        if (p.starterCode) {
          setCode(p.starterCode[language] || "");
        }
        if (p.visibleTestCases && p.visibleTestCases.length > 0) {
          setCustomStdin(p.visibleTestCases[0].input);
        }
        setRunOutput(null);
        setSubmitResult(null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [querySlug]);

  // When language changes, update starter code if user hasn't heavily modified
  const handleLanguageChange = (newLang: "java" | "python" | "cpp") => {
    setLanguage(newLang);
    if (currentProblem?.starterCode) {
      setCode(currentProblem.starterCode[newLang] || "");
    }
  };

  const handleResetCode = () => {
    if (confirm("Reset editor to starter code? Any unsaved edits will be lost.")) {
      if (currentProblem?.starterCode) {
        setCode(currentProblem.starterCode[language] || "");
      }
    }
  };

  // Run Code
  const handleRunCode = async () => {
    setIsRunning(true);
    setRunOutput(null);
    setConsoleTab("result");

    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin: customStdin,
          problemSlug: currentProblem?.slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRunOutput({ error: data.error || "Execution failed" });
      } else {
        setRunOutput(data);
      }
    } catch (err: any) {
      setRunOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);
    setConsoleTab("result");

    try {
      const res = await fetch("/api/coding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: currentProblem?.slug,
          language,
          code,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitResult({
          status: data.status || "error",
          passedCount: 0,
          totalCount: 0,
          errorMessage: data.message || data.error || "Submission failed",
          testResults: [],
        });
      } else {
        setSubmitResult(data);
      }
    } catch (err: any) {
      setSubmitResult({
        status: "error",
        passedCount: 0,
        totalCount: 0,
        errorMessage: err.message,
        testResults: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    if (!currentProblem) return;
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "problem", itemId: currentProblem.id }),
      });
      const data = await res.json();
      setIsBookmarked(data.isBookmarked);
    } catch {}
  };

  const currentIdx = problemList.findIndex(p => p.slug === querySlug);
  const prevProblem = currentIdx > 0 ? problemList[currentIdx - 1] : null;
  const nextProblem = currentIdx >= 0 && currentIdx < problemList.length - 1 ? problemList[currentIdx + 1] : null;

  if (loading && !currentProblem) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
          <p className="text-xs text-gray-400">Loading problem environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col bg-[#0b0f17]">
      {/* Top Problem Navigation Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-4 py-2 text-xs">
        <div className="flex items-center gap-3">
          {sessionId ? (
            <Link
              href={`/interview/${sessionId}`}
              className="inline-flex items-center gap-1 rounded bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-600/30 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Live Interview</span>
            </Link>
          ) : (
            <Link href="/" className="text-gray-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          )}

          <div className="h-4 w-px bg-gray-800" />

          {/* Problem Selector Dropdown */}
          <select
            value={querySlug}
            onChange={e => router.push(`/coding?slug=${e.target.value}${sessionId ? `&sessionId=${sessionId}` : ""}`)}
            className="rounded border border-gray-800 bg-gray-900 px-2 py-1 font-semibold text-white focus:outline-none"
          >
            {problemList.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.title} ({p.difficulty.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={!prevProblem}
              onClick={() => prevProblem && router.push(`/coding?slug=${prevProblem.slug}${sessionId ? `&sessionId=${sessionId}` : ""}`)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
              title="Previous Problem"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={!nextProblem}
              onClick={() => nextProblem && router.push(`/coding?slug=${nextProblem.slug}${sessionId ? `&sessionId=${sessionId}` : ""}`)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
              title="Next Problem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded transition ${isBookmarked ? "text-amber-400" : "text-gray-400 hover:text-white"}`}
            title="Bookmark Problem"
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-amber-400" : ""}`} />
          </button>

          {/* Language Selector */}
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value as any)}
            className="rounded border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs font-medium text-emerald-400 focus:outline-none"
          >
            <option value="java">Java (OpenJDK 25)</option>
            <option value="python">Python 3.14</option>
            <option value="cpp">C++ (GCC 15)</option>
          </select>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            className="flex items-center gap-1 text-gray-400 hover:text-white transition p-1"
            title="Reset to starter code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane: Problem Description & Tabs (5 cols) */}
        <div className="lg:col-span-5 flex flex-col border-r border-gray-800 bg-gray-950/40 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-gray-800 px-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("description")}
              className={`py-3 border-b-2 transition ${
                activeTab === "description" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("hints")}
              className={`py-3 border-b-2 flex items-center gap-1 transition ${
                activeTab === "hints" ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <span>Hints</span>
              <span className="rounded-full bg-gray-800 px-1.5 text-[10px] text-gray-400">
                {currentProblem?.hints.length || 0}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-gray-300">
            {activeTab === "description" && currentProblem && (
              <>
                {/* Title & Metadata */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white">{currentProblem.title}</h1>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        currentProblem.difficulty === "easy"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : currentProblem.difficulty === "medium"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {currentProblem.difficulty}
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentProblem.topicTags.map(tag => (
                      <span key={tag} className="rounded bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="leading-relaxed whitespace-pre-line text-gray-200">
                  {currentProblem.description}
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <h3 className="font-bold text-white">Examples</h3>
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3 space-y-1.5 font-mono text-[11px]">
                      <div>
                        <span className="text-gray-400">Input: </span>
                        <span className="text-gray-200">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Output: </span>
                        <span className="text-emerald-400">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="font-sans text-[11px] text-gray-400 pt-1 border-t border-gray-800">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <h3 className="font-bold text-white">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 font-mono text-[11px]">
                    {currentProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Complexity Target */}
                <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-1 text-[11px]">
                  <div className="font-semibold text-gray-300">Target Complexity:</div>
                  <div className="text-gray-400">Time: {currentProblem.timeComplexity}</div>
                  <div className="text-gray-400">Space: {currentProblem.spaceComplexity}</div>
                </div>
              </>
            )}

            {activeTab === "hints" && currentProblem && (
              <div className="space-y-4">
                <h3 className="font-bold text-white">Progressive Hints</h3>
                <p className="text-gray-400">
                  Reveal hints one by one if you get stuck on the algorithmic logic.
                </p>

                {currentProblem.hints.map((hint, idx) => {
                  const isRevealed = revealedHints.includes(idx);
                  return (
                    <div key={idx} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">Hint {idx + 1}</span>
                        {!isRevealed && (
                          <button
                            onClick={() => setRevealedHints(prev => [...prev, idx])}
                            className="rounded bg-blue-600/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400 hover:bg-blue-600/30"
                          >
                            Reveal Hint
                          </button>
                        )}
                      </div>
                      {isRevealed ? (
                        <p className="text-xs text-gray-200 leading-relaxed">{hint}</p>
                      ) : (
                        <div className="h-4 w-32 rounded bg-gray-800 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Monaco Editor & Test Runner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#1e1e1e]">
          {/* Top Monaco Editor (flex-1) */}
          <div className="flex-1 relative min-h-[300px]">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={val => setCode(val || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Consolas, 'Courier New', monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Lower Test Results & Console Pane */}
          <div className="h-64 border-t border-gray-800 bg-[#0d1117] flex flex-col">
            {/* Console Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2 text-xs bg-gray-950/60">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setConsoleTab("testcase")}
                  className={`font-semibold transition ${
                    consoleTab === "testcase" ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab("result")}
                  className={`font-semibold flex items-center gap-1.5 transition ${
                    consoleTab === "result" ? "text-white" : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <span>Results</span>
                  {submitResult && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        submitResult.status === "accepted" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Execution Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3.5 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white disabled:opacity-40 transition"
                >
                  <Play className="h-3 w-3 fill-gray-300" />
                  <span>{isRunning ? "Running..." : "Run Code"}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Compiling..." : "Submit Solution"}</span>
                </button>
              </div>
            </div>

            {/* Console Body */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300">
              {consoleTab === "testcase" && (
                <div className="space-y-3">
                  {/* Select visible test case pill */}
                  <div className="flex items-center gap-2">
                    {(currentProblem?.visibleTestCases || []).map((tc, idx) => (
                      <button
                        key={tc.id}
                        onClick={() => {
                          setSelectedTestCaseIndex(idx);
                          setCustomStdin(tc.input);
                        }}
                        className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                          selectedTestCaseIndex === idx
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Standard Input textarea */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-sans">Input (stdin):</label>
                    <textarea
                      rows={3}
                      value={customStdin}
                      onChange={e => setCustomStdin(e.target.value)}
                      className="w-full rounded border border-gray-800 bg-gray-900/90 p-2 text-xs text-gray-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {consoleTab === "result" && (
                <div className="space-y-3 font-sans">
                  {/* Run Code Output */}
                  {runOutput && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-gray-400">Single Test Execution:</span>
                        {runOutput.compileOutput ? (
                          <span className="text-red-400">Compilation Error</span>
                        ) : runOutput.error ? (
                          <span className="text-amber-400">Execution Notice</span>
                        ) : (
                          <span className="text-emerald-400">Executed Successfully</span>
                        )}
                        {runOutput.time !== undefined && (
                          <span className="text-gray-400 font-mono text-[11px]">
                            ({Math.round(runOutput.time * 1000)}ms)
                          </span>
                        )}
                      </div>

                      {runOutput.compileOutput && (
                        <div className="rounded bg-red-950/40 border border-red-500/30 p-3 font-mono text-xs text-red-300 whitespace-pre-wrap">
                          {runOutput.compileOutput}
                        </div>
                      )}

                      {runOutput.stdout && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-gray-400">Standard Output:</span>
                          <div className="rounded bg-gray-900 border border-gray-800 p-2 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                            {runOutput.stdout}
                          </div>
                        </div>
                      )}

                      {runOutput.error && !runOutput.compileOutput && (
                        <div className="rounded bg-amber-950/30 border border-amber-500/30 p-2.5 text-xs text-amber-300">
                          {runOutput.error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit All Test Cases Results */}
                  {submitResult && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              submitResult.status === "accepted"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {submitResult.status.replace("_", " ")}
                          </span>

                          <span className="text-xs text-gray-300">
                            Passed {submitResult.passedCount} / {submitResult.totalCount} Test Cases
                          </span>
                        </div>

                        {submitResult.runtimeMs !== undefined && (
                          <span className="text-xs text-gray-400 font-mono">
                            Runtime: {submitResult.runtimeMs}ms
                          </span>
                        )}
                      </div>

                      {submitResult.compileOutput && (
                        <div className="rounded bg-red-950/40 border border-red-500/30 p-3 font-mono text-xs text-red-300 whitespace-pre-wrap">
                          {submitResult.compileOutput}
                        </div>
                      )}

                      {/* Test case breakdown */}
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {submitResult.testResults.map((tc, idx) => (
                          <div
                            key={idx}
                            className={`rounded border p-2.5 text-xs font-mono flex items-center justify-between ${
                              tc.passed
                                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
                                : "border-red-500/30 bg-red-950/20 text-red-300"
                            }`}
                          >
                            <span>
                              Test Case {idx + 1} {tc.isHidden ? "(Hidden Case)" : ""}
                            </span>
                            <div className="flex items-center gap-2">
                              {tc.passed ? (
                                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 font-semibold text-red-400">
                                  <XCircle className="h-3.5 w-3.5" /> Failed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!runOutput && !submitResult && (
                    <div className="py-6 text-center text-xs text-gray-400">
                      Click "Run Code" to test stdin, or "Submit Solution" to run against all real compiler tests.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodingArenaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading coding arena...</div>}>
      <CodingArenaContent />
    </Suspense>
  );
}

