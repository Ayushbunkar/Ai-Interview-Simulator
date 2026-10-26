"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Download,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Layers,
  Calendar,
  Code2,
  MessageSquare,
  Sparkles,
  BarChart2,
} from "lucide-react";

interface ReportDetail {
  report: {
    id: string;
    sessionId: string;
    overallScore: number;
    roundScores: { round: number; name: string; score: number | null }[];
    technicalStrengths: string[];
    areasForImprovement: string[];
    communicationAssessment: string;
    codingAssessment: { summary: string; submissionsCount: number };
    sevenDayPlan: { day: number; focus: string; tasks: string[] }[];
    readinessSummary: string;
    readinessLevel: string;
    markdownExport: string;
    createdAt: string;
  };
  session: {
    title: string;
    targetRole: string;
    companyProfile: string;
    difficulty: string;
    mode: string;
    primaryLanguage: string;
  };
  rounds: {
    id: string;
    roundNumber: number;
    roundName: string;
    status: string;
    score: number | null;
    roundFeedback: string | null;
  }[];
  answers: {
    id: string;
    roundNumber: number;
    questionText: string;
    answerText: string;
    evaluationScore: number;
    rubricBreakdown: { name: string; score: number; weight: number; notes: string }[];
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  }[];
  submissions: {
    id: string;
    problemId: string;
    language: string;
    status: string;
    passedTests: number;
    totalTests: number;
    runtimeMs: number | null;
  }[];
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [data, setData] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then(r => {
        if (!r.ok) throw new Error("Report not found");
        return r.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [reportId]);

  const handleDownloadMarkdown = () => {
    if (!data) return;
    const blob = new Blob([data.report.markdownExport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviewForge-${data.session.companyProfile}-${data.session.targetRole}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviewForge-${data.session.companyProfile}-${data.session.targetRole}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-xs text-gray-400">Loading interview performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <h2 className="text-base font-bold text-white">Report Not Found</h2>
        <p className="text-xs text-gray-400">{error || "Could not retrieve report records."}</p>
        <Link href="/reports" className="inline-block rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
          Back to Reports
        </Link>
      </div>
    );
  }

  const { report, session, rounds, answers, submissions } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Reports</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700 hover:text-white transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Hero Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-gray-900/90 to-[#0d1527] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{session.companyProfile}</span>
              <span>•</span>
              <span>{session.targetRole}</span>
              <span>•</span>
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {session.title}
            </h1>
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center sm:text-right shrink-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">
              {report.overallScore}<span className="text-base text-gray-400">/100</span>
            </div>
            <div className="mt-1 text-xs font-bold text-white uppercase tracking-wider">
              {report.readinessLevel}
            </div>
          </div>
        </div>

        {/* Executive Text */}
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs text-gray-200 leading-relaxed">
          {report.readinessSummary}
        </div>
      </div>

      {/* Round-by-Round Score Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span>Performance by Round</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rounds.map(r => (
            <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-400">Round {r.roundNumber}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    r.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="font-semibold text-xs text-white">{r.roundName}</div>
              <div className="text-xl font-bold text-blue-400">
                {r.score !== null ? `${r.score}%` : "—"}
              </div>
              {r.roundFeedback && (
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {r.roundFeedback}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-emerald-500/20 bg-gray-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Demonstrated Strengths</span>
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            {report.technicalStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-gray-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            <span>Targeted Areas for Improvement</span>
          </h3>
          <ul className="space-y-2 text-xs text-gray-300">
            {report.areasForImprovement.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7-Day Personalized Practice Plan */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <span>7-Day Structured Placement Revision Plan</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {report.sevenDayPlan.map(day => (
            <div key={day.day} className="rounded-lg border border-gray-800 bg-gray-950/70 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                <span className="font-bold text-blue-400">Day {day.day}</span>
              </div>
              <div className="font-semibold text-gray-200 text-[11px]">{day.focus}</div>
              <ul className="space-y-1 text-[10px] text-gray-400">
                {day.tasks.map((t, idx) => (
                  <li key={idx} className="leading-tight">• {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Question-by-Question Recorded Answers & Rubrics */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <span>Detailed Question-by-Question Evaluation ({answers.length} Responses)</span>
        </h3>

        <div className="space-y-4">
          {answers.map((a, idx) => (
            <div key={a.id || idx} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span className="font-semibold text-blue-400">Question {idx + 1}</span>
                    <span>•</span>
                    <span>Round {a.roundNumber}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{a.questionText}</h4>
                </div>
                <div className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400 shrink-0">
                  {a.evaluationScore}/100
                </div>
              </div>

              {/* Candidate Answer */}
              <div className="rounded-lg border border-gray-800 bg-gray-950/80 p-3 text-xs text-gray-300">
                <span className="text-[10px] font-semibold text-gray-500 block mb-1">Your Answer:</span>
                <p className="whitespace-pre-wrap">{a.answerText}</p>
              </div>

              {/* Feedback */}
              {a.feedback && (
                <div className="rounded-lg border border-gray-800/80 bg-gray-900 p-3 text-xs text-gray-400 space-y-1">
                  <span className="text-[10px] font-semibold text-blue-400 block">Interviewer Assessment:</span>
                  <p className="whitespace-pre-wrap text-gray-300">{a.feedback}</p>
                </div>
              )}

              {/* Rubric Breakdown */}
              {a.rubricBreakdown && a.rubricBreakdown.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-gray-800/60">
                  {a.rubricBreakdown.map((r, i) => (
                    <div key={i} className="text-[10px] bg-gray-950/60 p-2 rounded border border-gray-800">
                      <div className="text-gray-400 truncate">{r.name}</div>
                      <div className="font-bold text-gray-200">{r.score}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
