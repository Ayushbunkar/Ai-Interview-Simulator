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
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { HistoricalAnalyticsSummary, RevisionItem } from "@/lib/types";

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
  const [analytics, setAnalytics] = useState<HistoricalAnalyticsSummary | null>(null);
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"completed" | "in_progress" | "analytics" | "revision">("completed");

  const loadData = async () => {
    try {
      const [rRes, sData, aRes, revRes] = await Promise.all([
        fetch("/api/reports").then(r => r.json()),
        fetch("/api/interviews").then(r => r.json()),
        fetch("/api/analytics").then(r => r.json()),
        fetch("/api/revision").then(r => r.json()),
      ]);

      setReports(rRes?.reports || []);
      setSessions(sData?.sessions?.filter((s: any) => s.status !== "completed") || []);
      setAnalytics(aRes?.analytics || null);
      setRevisionItems(revRes?.items || []);
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

  const handleMarkReviewed = async (itemId: string) => {
    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionItemId: itemId, action: "mark_reviewed" }),
      });
      if (res.ok) {
        setRevisionItems(prev =>
          prev.map(item => (item.id === itemId ? { ...item, status: "reviewed" } : item))
        );
      }
    } catch (err) {
      console.error("Failed to mark reviewed:", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 mb-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Interview Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Performance Records & Learning Progress
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Evidence-based interview history, historical analytics, spaced-repetition revision queue, and verified reports.
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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2 text-xs font-medium">
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

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "analytics"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Long-Term Analytics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("revision")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === "revision"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Brain className="h-3.5 w-3.5" />
          Revision Queue ({revisionItems.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-2" />
          Loading interview intelligence from database...
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
      ) : activeTab === "in_progress" ? (
        sessions.length === 0 ? (
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
        )
      ) : activeTab === "analytics" ? (
        /* Analytics Tab */
        <div className="space-y-6">
          {!analytics?.hasSufficientData && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-300">Insufficient Historical Evidence</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  A minimum of 2 completed interviews is required to generate statistically reliable trendlines. Displaying current baseline data without fabricated estimates.
                </p>
              </div>
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-black text-blue-500">{analytics?.totalInterviews || 0}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Total Interviews Started</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-black text-emerald-500">{analytics?.completedInterviews || 0}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Completed Interviews</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-black text-purple-500">{analytics?.averageScore || 0}/100</div>
              <div className="text-[11px] text-muted-foreground mt-1">Average Total Score</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-black text-cyan-500">{analytics?.codingAcceptanceRate || 0}%</div>
              <div className="text-[11px] text-muted-foreground mt-1">Compiler Acceptance Rate</div>
            </div>
          </div>

          {/* Round-wise performance */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Round-by-Round Performance Averages</h3>
            <div className="space-y-2">
              {analytics?.roundAverages.map((ra) => (
                <div key={ra.round} className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{ra.round}</span>
                    <span className="font-semibold text-foreground">{ra.averageScore}/100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${ra.averageScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Mastery Grid */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">14-Skill Mastery Status (Strictly Evidence-Based)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analytics?.topicMastery.map((tm) => {
                const isNotAssessed = tm.status === "not_assessed";
                return (
                  <div
                    key={tm.topic}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                  >
                    <span className="font-medium text-foreground">{tm.topic}</span>
                    {isNotAssessed ? (
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground italic">
                        Not Assessed
                      </span>
                    ) : (
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          tm.status === "mastered"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : tm.status === "proficient"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {tm.status.toUpperCase()} ({tm.score}/100)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Repeated Conceptual Mistakes */}
          {analytics?.repeatedMistakes && analytics.repeatedMistakes.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 space-y-2">
              <h3 className="text-xs font-bold text-red-300">Repeated Conceptual Gaps Requiring Practice</h3>
              <ul className="space-y-1 text-xs text-red-200">
                {analytics.repeatedMistakes.map((m, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Revision Queue Tab */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Spaced-Repetition Practice Queue</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Questions and coding drills where you scored &lt; 60 or failed compiler test cases, scheduled via SuperMemo SM-2.
              </p>
            </div>
            <Link
              href="/interview/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-yellow-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Launch Revision Interview</span>
            </Link>
          </div>

          {revisionItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-2">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
              <div className="text-sm font-semibold text-foreground">Revision queue is clean!</div>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active conceptual deficits or failed compiler submissions pending review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {revisionItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-2 transition-all hover:border-yellow-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{item.title}</span>
                      <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-500 border border-yellow-500/20 uppercase">
                        {item.reason.replace(/_/g, " ")}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                        {item.status}
                      </span>
                    </div>

                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleMarkReviewed(item.id)}
                        className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white transition"
                      >
                        Mark Reviewed
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{item.evidenceContext}</p>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border">
                    <span>Repetition Count: {item.repetitionCount}</span>
                    <span>Interval: {item.intervalDays} day(s)</span>
                    <span>Next Review Due: {new Date(item.nextReviewDue).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
