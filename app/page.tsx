"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Play,
  Code,
  BookOpen,
  FileCheck,
  Settings,
  Flame,
  Award,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  BarChart3,
  Layers,
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
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-gray-900/80 to-[#0d1527] p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>4-Round Realistic Technical Hiring Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Forge Your Career in Tech.
          </h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Experience simulated real-world software engineering interviews calibrated for{" "}
            <span className="font-semibold text-blue-400">TCS, Capgemini, service firms, and product companies</span>.
            Practice coding challenges with live compiler execution, answer probing technical questions, and receive detailed hiring readiness reports.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-[1.02]"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Start Full Interview</span>
            </Link>

            <Link
              href="/coding"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition"
            >
              <Code className="h-4 w-4 text-emerald-400" />
              <span>Coding Practice</span>
            </Link>

            <Link
              href="/questions"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Question Bank ({data?.totalQuestionsCount || 200}+)</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Real Stored Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Completed Interviews</span>
            <Award className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : data?.totalCompleted ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {data?.totalCompleted === 0 ? "No sessions finished yet" : "Stored locally in SQLite"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Average Interview Score</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : data?.totalCompleted ? `${data.averageScore}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {data?.totalCompleted ? "Calibrated rubric index" : "Start your first interview to track"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Code Submissions</span>
            <Code className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : data?.totalSubmissions ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {data?.totalSubmissions ? `${data.acceptedSubmissions} Accepted` : "OnlineCompiler.io connected"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Coding Accuracy</span>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : data?.totalSubmissions ? `${data.codingAccuracy}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            {data?.totalSubmissions ? "Passing all test cases" : "Real execution tests"}
          </p>
        </div>
      </div>

      {/* Quick Launch & Round Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-400" />
            <span>Four-Round Hiring Simulation</span>
          </h2>
          <span className="text-xs text-gray-400">Complete all 4 or target individual rounds</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-blue-500/40 transition group">
            <div className="flex items-center justify-between">
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                Round 1
              </span>
              <span className="text-[11px] text-gray-400">8 Questions</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-blue-400 transition">
              Technical Fundamentals
            </h3>
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              Java fundamentals, OOP, Collections, Exception handling, Strings, arrays & SQL basics.
            </p>
            <Link
              href="/interview/new?round=1"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              <span>Practice Round 1</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-indigo-500/40 transition group">
            <div className="flex items-center justify-between">
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                Round 2
              </span>
              <span className="text-[11px] text-gray-400">8 Questions</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-indigo-400 transition">
              Advanced CS & Projects
            </h3>
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              DBMS transactions, OS, Computer Networks, REST APIs, Git & resume project trade-offs.
            </p>
            <Link
              href="/interview/new?round=2"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              <span>Practice Round 2</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-emerald-500/40 transition group">
            <div className="flex items-center justify-between">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                Round 3
              </span>
              <span className="text-[11px] text-gray-400">LeetCode-style</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-emerald-400 transition">
              Coding Interview
            </h3>
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              Live Monaco editor, approach clarification, real compiler test cases & complexity analysis.
            </p>
            <Link
              href="/coding"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              <span>Enter Coding Arena</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-purple-500/40 transition group">
            <div className="flex items-center justify-between">
              <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-400">
                Round 4
              </span>
              <span className="text-[11px] text-gray-400">8 Questions</span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-white group-hover:text-purple-400 transition">
              Behavioral & HR
            </h3>
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              STAR framework, project ownership, conflict resolution, deadlines, and company culture fit.
            </p>
            <Link
              href="/interview/new?round=4"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300"
            >
              <span>Practice Round 4</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Weakest Areas & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Practice & Focus Areas */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-400" />
            <span>Recommended Practice Topics</span>
          </h3>

          <div className="space-y-2.5">
            {(data?.recommendedTopics || []).map((topic, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-gray-800/80 bg-gray-950/60 p-3 text-xs"
              >
                <span className="font-medium text-gray-200">{topic}</span>
                <Link
                  href={`/questions?search=${encodeURIComponent(topic.split(" ")[0])}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Derived dynamically from your recorded answers and evaluations.</span>
          </div>
        </div>

        {/* Right Column: Recent Reports & History (2 cols wide) */}
        <div className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-400" />
              <span>Recent Interview Reports</span>
            </h3>
            <Link href="/reports" className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading interview history...</div>
          ) : !data?.recentReports || data.recentReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center space-y-3">
              <Flame className="mx-auto h-8 w-8 text-gray-600" />
              <div className="text-sm font-medium text-gray-300">No interviews recorded yet</div>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Begin your first mock interview to generate performance analytics, rubric scores, and a custom 7-day practice roadmap.
              </p>
              <Link
                href="/interview/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <span>Launch First Session</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recentReports.map(rep => (
                <Link
                  key={rep.id}
                  href={`/reports/${rep.id}`}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-3.5 hover:border-gray-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {rep.title || `${rep.companyProfile} ${rep.targetRole}`}
                      </span>
                      <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-300">
                        {rep.companyProfile}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {new Date(rep.createdAt).toLocaleDateString()} • {rep.targetRole}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-400">{rep.overallScore}/100</div>
                      <div className="text-[10px] text-gray-400">{rep.readinessLevel}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-500" />
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
