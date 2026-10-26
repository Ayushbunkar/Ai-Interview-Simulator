"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Award,
  Calendar,
  Building2,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface ReportSummary {
  id: string;
  sessionId: string;
  overallScore: number;
  readinessLevel: string;
  readinessSummary: string;
  createdAt: string;
  title: string;
  targetRole: string;
  companyProfile: string;
  difficulty: string;
  mode: string;
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 mb-2">
            <FileText className="h-3 w-3" />
            <span>Recorded Evaluations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interview Performance Reports
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Reopen your detailed 4-round reports, question-by-question rubrics, coding test executions, and personalized 7-day practice roadmaps.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Interview</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Loading reports history...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 p-12 text-center space-y-3">
          <Award className="mx-auto h-8 w-8 text-gray-600" />
          <div className="text-sm font-semibold text-white">No interview reports on record</div>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Once you conclude a 4-round simulated interview, your answers, coding compiler test results, and hiring assessments will persist here.
          </p>
          <Link
            href="/interview/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <span>Start Practice Interview</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <Link
              key={r.id}
              href={`/reports/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/60 p-4 transition-all hover:border-gray-700 hover:bg-gray-900"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">{r.title}</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                    {r.companyProfile}
                  </span>
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400 uppercase">
                    {r.mode}
                  </span>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{r.targetRole}</span>
                  <span>•</span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-base font-bold text-blue-400">{r.overallScore}/100</div>
                  <div
                    className={`text-[10px] font-bold ${
                      r.readinessLevel === "Strong Hire"
                        ? "text-emerald-400"
                        : r.readinessLevel === "Hire"
                        ? "text-cyan-400"
                        : "text-amber-400"
                    }`}
                  >
                    {r.readinessLevel}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
