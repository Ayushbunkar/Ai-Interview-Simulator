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
  BookOpen,
  Volume2,
  Terminal,
  Check,
  Flame,
} from "lucide-react";
import { CommunicationReport, SkillRadarAnalysis, DetailedProblemCodingReport, ROUND_NAMES } from "@/lib/types";

interface ReportDetail {
  report: {
    id: string;
    sessionId: string;
    overallScore: number;
    roundScores: { round: number; name: string; score: number | null }[];
    technicalStrengths: string[];
    areasForImprovement: string[];
    communicationAssessment: any;
    codingAssessment: any;
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
    durationMinutes: number;
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
    code?: string;
  }[];
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [data, setData] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    const blob = new Blob([data.report.markdownExport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviewForge-Report-${reportId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `InterviewForge-Report-${reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground">Generating Candidate Performance Dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Report Not Found</h2>
        <p className="text-sm text-muted-foreground">{error || "The requested interview report does not exist."}</p>
        <Link href="/reports" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          Back to Reports History
        </Link>
      </div>
    );
  }

  const { report, session, rounds, answers, submissions } = data;

  // Parse structured communication & skill radar
  let communicationReport: CommunicationReport | null = null;
  if (typeof report.communicationAssessment === "object") {
    communicationReport = report.communicationAssessment;
  } else if (typeof report.communicationAssessment === "string") {
    try {
      communicationReport = JSON.parse(report.communicationAssessment);
    } catch {
      // String format fallback
    }
  }

  let skillRadar: SkillRadarAnalysis | null = null;
  let detailedCodingReports: DetailedProblemCodingReport[] = [];
  if (report.codingAssessment && typeof report.codingAssessment === "object") {
    if (report.codingAssessment.skillRadar) skillRadar = report.codingAssessment.skillRadar;
    if (report.codingAssessment.detailedCodingReports) detailedCodingReports = report.codingAssessment.detailedCodingReports;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/reports" className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Interview History
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Link Copied" : "Share"}
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Markdown
          </button>
        </div>
      </div>

      {/* Section A: Header & Executive Summary */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-500/10 text-blue-500">
                {session.companyProfile} Interview
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground uppercase">
                {session.difficulty}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
            <p className="text-xs text-muted-foreground">
              Candidate Target Role: <strong className="text-foreground">{session.targetRole}</strong> • Completed on{" "}
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-extrabold text-blue-500">{report.overallScore}/100</div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
              {report.readinessLevel}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm leading-relaxed text-foreground">
          <span className="font-semibold text-blue-500">Executive Summary: </span>
          {report.readinessSummary}
        </div>

        {/* Round Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {rounds.map((r) => (
            <div key={r.roundNumber} className="rounded-xl border border-border bg-background p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Round {r.roundNumber}</span>
                <span className="font-bold text-foreground">
                  {r.score !== null ? `${r.score}/100` : "Incomplete"}
                </span>
              </div>
              <div className="text-xs font-semibold text-foreground truncate">{r.roundName}</div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{r.roundFeedback || "Round completed."}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: English Grammar & Communication Report */}
      {communicationReport && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-foreground">English Grammar & Communication Report</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="text-xl font-bold text-indigo-500">{communicationReport.overallScore}/100</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">Overall Communication</div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="text-xl font-bold text-foreground">{communicationReport.grammarScore}/100</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">Grammar & Syntax</div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="text-xl font-bold text-foreground">{communicationReport.clarityScore}/100</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">Clarity & Articulation</div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="text-xl font-bold text-foreground">{communicationReport.technicalExplanationScore}/100</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">Technical Vocabulary</div>
            </div>
          </div>

          {/* Grammar Issues with Exact Sentences and Corrections */}
          {communicationReport.issues && communicationReport.issues.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Grammatical & Phrasing Corrections from Candidate Transcripts:
              </h3>
              <div className="grid gap-3">
                {communicationReport.issues.map((iss, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-background p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{iss.identifiedIssue}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                        <span className="font-bold block text-[10px] uppercase mb-0.5">Submitted Transcript:</span>
                        "{iss.submittedSentence}"
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <span className="font-bold block text-[10px] uppercase mb-0.5">Grammatical Correction:</span>
                        "{iss.correctedSentence}"
                      </div>
                    </div>

                    {iss.improvedInterviewVersion && (
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                        <span className="font-bold block text-[10px] uppercase mb-0.5">
                          Professional Interview-Ready Phrasing:
                        </span>
                        "{iss.improvedInterviewVersion}"
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground pt-1">{iss.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>No major grammatical errors detected in candidate transcripts. Excellent clarity of expression.</span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground italic border-t border-border pt-3">
            * {communicationReport.disclaimer}
          </p>
        </div>
      )}

      {/* Section F: Skill Radar & Weakness Analysis (16 Independent Categories) */}
      {skillRadar && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-foreground">Skill Radar & Weakness Root-Cause Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {skillRadar.skills.map((s) => (
              <div
                key={s.skill}
                className={`rounded-xl border p-3.5 space-y-1.5 ${
                  s.assessed
                    ? (s.score || 0) >= 75
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate">{s.label}</span>
                  <span
                    className={`font-mono font-bold ${
                      s.assessed
                        ? (s.score || 0) >= 75
                          ? "text-emerald-500"
                          : "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.assessed ? `${s.score}%` : "Not Assessed"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{s.evidence}</p>
                {s.assessed && (
                  <p className="text-[10px] text-foreground font-medium pt-1 border-t border-border/50">
                    Action: {s.action}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Demonstrated Weakness Root-Cause Origin:</span>
            </div>
            <p className="text-muted-foreground">
              {skillRadar.gapOrigin.knowledgeGap && "• Knowledge Gap: Requires systematic revision of foundational CS theory and specifications."}
              {skillRadar.gapOrigin.reasoningGap && " • Reasoning Gap: Requires practice identifying optimal algorithmic invariants and complexity trade-offs."}
              {skillRadar.gapOrigin.implementationGap && " • Implementation Gap: Requires practicing hands-on edge-case checks and compiler bug resolutions."}
              {skillRadar.gapOrigin.communicationGap && " • Communication Gap: Focus on delivering structured STAR responses without technical ambiguity."}
              {!skillRadar.gapOrigin.knowledgeGap && !skillRadar.gapOrigin.reasoningGap && !skillRadar.gapOrigin.implementationGap && !skillRadar.gapOrigin.communicationGap && " • Demonstrates strong calibration across tested knowledge, implementation, and verbal reasoning."}
            </p>
          </div>
        </div>
      )}

      {/* Section C: Detailed Coding Assessment & Compiler Results */}
      {submissions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">Coding Assessment & Real Compiler Verification</h2>
          </div>

          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-sm text-foreground">{sub.problemId}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-muted text-muted-foreground">
                      {sub.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        sub.status === "accepted" ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {sub.status}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {sub.passedTests}/{sub.totalTests} tests passed
                    </span>
                    {sub.runtimeMs && <span className="font-mono text-muted-foreground">{sub.runtimeMs}ms</span>}
                  </div>
                </div>

                {sub.code && (
                  <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                    {sub.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section B: Technical Question-by-Question Assessment */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-bold text-foreground">Question-by-Question Technical Assessment</h2>
        </div>

        <div className="space-y-4">
          {answers.map((ans, idx) => (
            <div key={ans.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Question {idx + 1} • Round {ans.roundNumber} ({ROUND_NAMES[ans.roundNumber as 1 | 2 | 3 | 4]})
                  </span>
                  <h3 className="font-semibold text-sm text-foreground">{ans.questionText}</h3>
                </div>

                {ans.evaluationScore !== null && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 font-mono font-bold text-xs shrink-0">
                    {ans.evaluationScore}/100
                  </span>
                )}
              </div>

              {/* Candidate Transcript */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                <span className="font-bold text-[10px] uppercase text-muted-foreground block">
                  Recorded Answer Transcript:
                </span>
                <p className="text-foreground leading-relaxed">"{ans.answerText}"</p>
              </div>

              {/* Formative Feedback */}
              {ans.feedback && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground">Interviewer Feedback: </span>
                  <span>{ans.feedback}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section G: Personalized 7-Day Targeted Practice Plan */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-foreground">Personalized 7-Day Targeted Revision Roadmap</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.sevenDayPlan.map((plan) => (
            <div key={plan.day} className="rounded-xl border border-border bg-background p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-500">Day {plan.day}</span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Focus</span>
              </div>
              <h3 className="font-bold text-sm text-foreground">{plan.focus}</h3>
              <ul className="space-y-1 text-xs text-muted-foreground pt-1">
                {plan.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
