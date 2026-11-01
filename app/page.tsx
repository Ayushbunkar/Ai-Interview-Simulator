"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  Code,
  BookOpen,
  FileCheck,
  Award,
  TrendingUp,
  Target,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Mic,
  CalendarCheck2,
  Flame,
  CheckCircle2,
  Terminal,
} from "lucide-react";

interface AnalyticsData {
  totalCompleted: number;
  averageScore: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  codingAccuracy: number;
  totalQuestionsCount: number;
  strongestSubjects: { name: string; average: number; count: number }[];
  weakestSubjects: { name: string; average: number; count: number }[];
  recentReports: {
    id: string;
    sessionId: string;
    overallScore: number;
    readinessLevel: string;
    title: string;
    targetRole: string;
    companyProfile: string;
    createdAt: string;
  }[];
  recommendedTopics: string[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Section - Linear / Vercel style */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-10 shadow-sm transition-colors">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enterprise 4-Round AI Interview Simulator</span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-zinc-900 dark:text-zinc-50">
            Calibrated technical simulations for software engineering roles.
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Simulate realistic, multi-round technical interviews calibrated for{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">TCS, Capgemini, product companies, and high-growth startups</span>.
            Execute real code with live compiler feedback, practice spoken dialogue, and review strict rubric scorecards.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Full Interview</span>
            </Link>

            <Link
              href="/coding"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition shadow-sm"
            >
              <Code className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Coding Arena</span>
            </Link>

            <Link
              href="/interview-ready"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition shadow-sm"
            >
              <CalendarCheck2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>34-Day Roadmap</span>
            </Link>

            <Link
              href="/speech-drill"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition shadow-sm"
            >
              <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Speech Drill</span>
            </Link>

            <Link
              href="/questions"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition shadow-sm"
            >
              <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Question Bank ({data?.totalQuestionsCount || 200}+)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Sessions</span>
            <Award className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {loading ? "..." : data?.totalCompleted ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data?.totalCompleted === 0 ? "No sessions finished yet" : "Evaluated & saved in database"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Average Score</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {loading ? "..." : data?.totalCompleted ? `${data.averageScore}%` : "—"}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data?.totalCompleted ? "Calibrated rubric index" : "Start your first interview to track"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Code Submissions</span>
            <Code className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {loading ? "..." : data?.totalSubmissions ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data?.totalSubmissions ? `${data.acceptedSubmissions} Accepted` : "OnlineCompiler.io connected"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Coding Accuracy</span>
            <Target className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {loading ? "..." : data?.totalSubmissions ? `${data.codingAccuracy}%` : "—"}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data?.totalSubmissions ? "Passing all test cases" : "Real execution tests"}
          </p>
        </div>
      </div>

      {/* 34-Day Master Curriculum Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Full 34-Day Technical Curriculum • 10 Phases</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Interview Ready: Day-by-Day Master Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Track your daily progress across 10 Phases (Java/OOP, DBMS/SQL, OS, Networks, APIs, Linux/Git, LLD, HLD, Projects, and AI/ML Engineering). Complete with model answers, interviewer rationale, and practical drills.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="/interview-ready"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-white transition"
            >
              <span>Open Master Curriculum</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Four-Round Hiring Simulation Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <span>Four-Round Hiring Simulation</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Complete full 4-round sequence or target specific rounds independently.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Round 1 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-xs font-semibold">
                  Round 1
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">8 Questions</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Technical Fundamentals
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Java fundamentals, OOP concepts, Collections, Exception handling, Strings, arrays & SQL basics.
              </p>
            </div>
            <Link
              href="/interview/new?round=1"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Practice Round 1</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Round 2 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-xs font-semibold">
                  Round 2
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">8 Questions</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Advanced CS & Projects
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                DBMS transactions, OS, Computer Networks, REST APIs, Git & resume project technical trade-offs.
              </p>
            </div>
            <Link
              href="/interview/new?round=2"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span>Practice Round 2</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Round 3 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-xs font-semibold">
                  Round 3
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">LeetCode-style</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Coding Interview
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Live Monaco editor, edge cases, real compiler test cases & complexity analysis.
              </p>
            </div>
            <Link
              href="/coding"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Enter Coding Arena</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Round 4 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 px-2 py-0.5 text-xs font-semibold">
                  Round 4
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">8 Questions</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Behavioral & HR
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                STAR framework, project ownership, conflict resolution, deadlines, and culture fit.
              </p>
            </div>
            <Link
              href="/interview/new?round=4"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              <span>Practice Round 4</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Weakest Areas & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Practice Topics */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <span>Recommended Practice Topics</span>
            </h3>
          </div>

          <div className="space-y-2">
            {(data?.recommendedTopics || []).length > 0 ? (
              data!.recommendedTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-2.5 text-xs"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{topic}</span>
                  <Link
                    href={`/questions?search=${encodeURIComponent(topic.split(" ")[0])}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
                  >
                    Review
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Topics will adapt dynamically after completing your first simulation.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Derived dynamically from your recorded answers.</span>
          </div>
        </div>

        {/* Right Column: Recent Reports */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-500" />
              <span>Recent Interview Reports</span>
            </h3>
            <Link href="/reports" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Loading interview history...
            </div>
          ) : !data?.recentReports || data.recentReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3">
              <Flame className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No interviews recorded yet
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Begin your first mock interview to generate performance analytics, rubric scores, and calibrated feedback.
              </p>
              <Link
                href="/interview/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition"
              >
                <span>Launch First Session</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentReports.map(rep => (
                <Link
                  key={rep.id}
                  href={`/reports/${rep.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {rep.title || `${rep.companyProfile} ${rep.targetRole}`}
                      </span>
                      <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                        {rep.companyProfile}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {new Date(rep.createdAt).toLocaleDateString()} • {rep.targetRole}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {rep.overallScore}/100
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {rep.readinessLevel}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}