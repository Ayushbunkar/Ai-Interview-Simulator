"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  ArrowRight,
  Mic,
} from "lucide-react";

interface QuestionItem {
  id: string;
  category: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  companyTags: string[];
  questionText: string;
  expectedAnswer: string;
  explanation: string;
  followUps: string[];
  isBookmarked: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Categories",
  java_oop: "Java & OOP (30)",
  dbms_sql: "DBMS & SQL (25)",
  os: "Operating Systems (20)",
  networks: "Computer Networks (20)",
  dsa_concepts: "DSA Concepts (30)",
  backend_api: "Backend & REST (15)",
  system_design: "System Design (20)",
  behavioral: "Behavioral & HR (40)",
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [company, setCompany] = useState("all");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (difficulty !== "all") params.set("difficulty", difficulty);
    if (company !== "all") params.set("company", company);
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
      setFetchError(false);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 200);
    return () => clearTimeout(timer);
  }, [category, difficulty, company, search]);

  const toggleBookmark = async (id: string) => {
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "question", itemId: id }),
      });
      const data = await res.json();
      setQuestions(prev =>
        prev.map(q => (q.id === id ? { ...q, isBookmarked: data.isBookmarked } : q))
      );
    } catch {}
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            <BookOpen className="h-3 w-3" />
            <span>200+ Curated Placement Questions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Interview Question Bank
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Comprehensive technical repository covering Java, CS fundamentals, databases, system design, and HR scenarios.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition self-start sm:self-auto shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Launch Mock Interview</span>
        </Link>
      </div>

      {/* Speech Drill Callout Banner */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
            <Mic className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                SDE Speech & Articulation Drill Room
              </span>
              <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                14 Topics • 800 Questions
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Practice speaking answers aloud with speech recognition, pronunciation scoring, and WPM pace feedback.
            </p>
          </div>
        </div>
        <Link
          href="/speech-drill"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0 self-start sm:self-auto"
        >
          <span>Open Speech Drill</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search keywords, concepts, or questions (e.g. 'JVM', 'B-Tree', 'Dijkstra', 'Kafka', 'STAR')..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Difficulty */}
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy (Fundamentals)</option>
            <option value="medium">Medium (Standard)</option>
            <option value="hard">Hard (Advanced)</option>
          </select>

          {/* Company */}
          <select
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value="all">All Company Styles</option>
            <option value="TCS">TCS Digital / Ninja</option>
            <option value="Capgemini">Capgemini</option>
            <option value="Product">Product-Based Companies</option>
            <option value="Service">Service-Based Companies</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent" />
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Loading placement questions...</div>
        </div>
      ) : fetchError ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900/60 p-12 text-center space-y-3">
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">Unable to load questions from server</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Please check your database connection and retry.</p>
          <button
            onClick={() => fetchQuestions()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 transition"
          >
            Retry Loading
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-2">
          <BookOpen className="mx-auto h-8 w-8 text-zinc-400" />
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No questions match your criteria</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Try adjusting your filters or search keywords.</p>
          <button
            onClick={() => {
              setCategory("all");
              setDifficulty("all");
              setCompany("all");
              setSearch("");
            }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
            <span>Showing {questions.length} questions</span>
          </div>

          {questions.map((q) => {
            const isExpanded = expandedId === q.id;
            return (
              <div
                key={q.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-medium text-zinc-700 dark:text-zinc-300">
                        {CATEGORY_LABELS[q.category] || q.category}
                      </span>

                      <span
                        className={`rounded px-1.5 py-0.5 font-bold uppercase ${
                          q.difficulty === "easy"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : q.difficulty === "medium"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        }`}
                      >
                        {q.difficulty}
                      </span>

                      {q.companyTags.map(tag => (
                        <span key={tag} className="rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Question Statement */}
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      {q.questionText}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleBookmark(q.id)}
                      className={`p-1.5 rounded transition ${
                        q.isBookmarked ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      }`}
                      title="Bookmark Question"
                    >
                      <Bookmark className={`h-4 w-4 ${q.isBookmarked ? "fill-amber-500" : ""}`} />
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="p-1.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                      title={isExpanded ? "Collapse" : "Expand answer"}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Answer Benchmarks & Explanation */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-xs leading-relaxed">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-3 space-y-1 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        Expected Answer & Evaluation Benchmark:
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200">{q.expectedAnswer}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Conceptual Explanation:
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-400">{q.explanation}</p>
                    </div>

                    {q.followUps && q.followUps.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          Likely Interviewer Follow-Up Questions:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                          {q.followUps.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}