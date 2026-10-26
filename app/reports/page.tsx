"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Award,
  Calendar,
  Building2,
  ArrowRight,
  Sparkles,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
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

interface ActiveSession {
  id: string;
  title: string;
  targetRole: string;
  companyProfile: string;
  difficulty: string;
  mode: string;
  currentRound: number;
  status: string;
  createdAt: string;
}

export default function ReportsListPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"completed" | "in_progress">("completed");

  const loadData = async () => {
    try {
      const [rRes, sRes] = await fetch("/api/reports").then(r => r.json()),
        [sData] = await Promise.all([fetch("/api/interviews").then(r => r.json())]);

      setReports(rRes?.reports || []);
      setSessions(sData?.sessions?.filter((s: any) => s.status !== "completed") || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this interview session and all its records?")) {
      return;
    }

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.sessionId !== sessionId));
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Interview History & Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Interview Performance Records
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Persistent interview transcripts, compiler execution outputs, grammar assessments, and personalized 7-day practice plans.
          </p>
        </div>

        <Link
          href="/interview/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>New Voice Interview</span>
        </Link>
      </div>

      {/* Tabs: Completed Reports vs In-Progress Sessions */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "completed"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Completed Reports ({reports.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("in_progress")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "in_progress"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          In-Progress Sessions ({sessions.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
          Loading interview records from database...
        </div>
      ) : activeTab === "completed" ? (
        reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
            <Award className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-semibold text-foreground">No completed reports on record</div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Once you finish a simulated 4-round interview, your performance evaluation, English grammar scores, and compiler executions will appear here.
            </p>
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <span>Start Voice Interview</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-blue-500/40 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{r.title}</span>
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500 border border-blue-500/20">
                      {r.companyProfile}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                      {r.mode}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">{r.readinessSummary}</p>

                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {r.targetRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-base font-bold text-blue-500">{r.overallScore}/100</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase">{r.readinessLevel}</div>
                  </div>

                  <Link
                    href={`/reports/${r.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-all"
                  >
                    <span>Open Report</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(r.sessionId, e)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-3">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-semibold text-foreground">No active or paused sessions</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            All your interview sessions have been completed or no incomplete interviews are pending.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-amber-500/40 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{s.title}</span>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/20">
                    Round {s.currentRound} ({s.status})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.companyProfile} • {s.targetRole} ({s.difficulty})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/interview/${s.id}`}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume Interview</span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete Incomplete Session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
