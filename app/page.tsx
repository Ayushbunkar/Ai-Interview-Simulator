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
  Mic,
  CalendarCheck2,
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
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-[#090d16] p-7 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Enterprise 4-Round AI Interview Simulator</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Master the Tech Interview.
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Simulate realistic, multi-round engineering interviews calibrated for{" "}
            <span className="font-semibold text-blue-400">TCS, Capgemini, high-growth startups, and product companies</span>.
            Execute real code with live compiler feedback, practice spoken dialogue, and review calibrated readiness scorecards.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch Full Interview</span>
            </Link>

            <Link
              href="/coding"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Code className="h-4 w-4 text-emerald-400" />
              <span>Coding Practice Arena</span>
            </Link>

            <Link
              href="/interview-ready"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/70 via-orange-950/70 to-yellow-950/70 px-4 py-3 text-sm font-bold text-amber-300 hover:text-white hover:border-amber-400 transition shadow-lg shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CalendarCheck2 className="h-4 w-4 text-amber-400" />
              <span>Interview Ready (30-Day Master Roadmap)</span>
            </Link>

            <Link
              href="/speech-drill"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 px-4 py-3 text-sm font-semibold text-cyan-300 hover:text-white hover:border-cyan-500/60 transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="h-4 w-4 text-cyan-400" />
              <span>700 SDE Speech Drill Room</span>
            </Link>

            <Link
              href="/questions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <span>Question Bank ({data?.totalQuestionsCount || 200}+)</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Real Stored Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm hover:border-white/[0.15] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <Award className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {loading ? "..." : data?.totalCompleted ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {data?.totalCompleted === 0 ? "No sessions finished yet" : "Stored locally in SQLite"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm hover:border-white/[0.15] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {loading ? "..." : data?.totalCompleted ? `${data.averageScore}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {data?.totalCompleted ? "Calibrated rubric index" : "Start your first interview to track"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm hover:border-white/[0.15] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Code Submissions</span>
            <Code className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {loading ? "..." : data?.totalSubmissions ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {data?.totalSubmissions ? `${data.acceptedSubmissions} Accepted` : "OnlineCompiler.io connected"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm hover:border-white/[0.15] transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Coding Accuracy</span>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {loading ? "..." : data?.totalSubmissions ? `${data.codingAccuracy}%` : "—"}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {data?.totalSubmissions ? "Passing all test cases" : "Real execution tests"}
          </p>
        </div>
      </div>

      {/* 30-Day Interview Ready Master Roadmap Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900/90 p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              <span>Full 30-Day Technical Curriculum • November 1 to 30</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Interview Ready: The Day-by-Day Master Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tick your daily progress across 9 Phases (Java/OOP, DBMS/SQL, OS, Networks, APIs, Linux/Git, LLD, HLD, Projects).
              Complete with model answers, under-the-hood interviewer logic, architectural diagrams, and practical coding tasks.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/interview-ready"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition hover:scale-[1.02]"
            >
              <span>Open 30-Day Curriculum</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
