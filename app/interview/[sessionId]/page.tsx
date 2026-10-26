"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pause,
  Send,
  HelpCircle,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Bot,
  User,
  Info,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { ROUND_NAMES } from "@/lib/interview/engine";
import { RoundNumber } from "@/lib/types";

interface Message {
  id: string;
  roundNumber: number;
  sender: "interviewer" | "candidate" | "system";
  messageType: string;
  content: string;
  timestamp: string;
}

interface SessionData {
  id: string;
  title: string;
  targetRole: string;
  companyProfile: string;
  difficulty: string;
  mode: "strict" | "practice";
  currentRound: RoundNumber;
  currentQuestionIndex: number;
  durationMinutes: number;
  timeRemainingSeconds: number;
  isPaused: boolean;
  status: string;
}

interface RoundData {
  id: string;
  roundNumber: number;
  roundName: string;
  status: string;
  score: number | null;
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Input states
  const [answerInput, setAnswerInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Clarification Modal state
  const [isClarifyOpen, setIsClarifyOpen] = useState(false);
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifying, setClarifying] = useState(false);

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [isPaused, setIsPaused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session state
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load interview session.");
      const data = await res.json();
      setSession(data.session);
      setRounds(data.rounds);
      setMessages(data.messages);
      setSecondsRemaining(data.session.timeRemainingSeconds || data.session.durationMinutes * 60);
      setIsPaused(data.session.isPaused);
      setLoading(false);

      if (data.session.status === "completed" && data.reportId) {
        router.push(`/reports/${data.reportId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load session");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Live Timer countdown
  useEffect(() => {
    if (isPaused || loading || !session || session.status === "completed") return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loading, session]);

  // Submit candidate answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || submitting) return;

    setSubmitting(true);
    const submittedText = answerInput.trim();
    setAnswerInput("");

    // Optimistic UI update
    setMessages(prev => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        roundNumber: session?.currentRound || 1,
        sender: "candidate",
        messageType: "answer",
        content: submittedText,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/interviews/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: submittedText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");

      // Refetch latest session messages and rounds
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit candidate clarification / interruption
  const handleAskInterviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyQuestion.trim() || clarifying) return;

    setClarifying(true);
    const qText = clarifyQuestion.trim();

    try {
      const res = await fetch(`/api/interviews/${sessionId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ask clarification");

      setClarifyQuestion("");
      setIsClarifyOpen(false);
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClarifying(false);
    }
  };

  // Pause session
  const handleTogglePause = async () => {
    const endpoint = isPaused ? "resume" : "pause";
    try {
      const res = await fetch(`/api/interviews/${sessionId}/${endpoint}`, {
        method: "POST",
      });
      if (res.ok) {
        setIsPaused(!isPaused);
        await fetchSession();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // End Interview early
  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end this interview now? A performance report will be generated based on your answers so far.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/finish`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.reportId) {
        router.push(`/reports/${data.reportId}`);
      } else {
        throw new Error(data.error || "Failed to generate final report");
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-xs text-gray-400">Loading interview room...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h2 className="text-base font-bold text-white">Error Loading Session</h2>
        <p className="text-xs text-gray-400">{error}</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentRoundNum = session?.currentRound || 1;

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col bg-[#0b0f17]">
      {/* Top Header Bar */}
      <div className="border-b border-gray-800 bg-gray-950/80 px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Round Information */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">
              <span>Round {currentRoundNum} of 4:</span>
              <span className="text-white">{ROUND_NAMES[currentRoundNum as RoundNumber]}</span>
            </div>

            <span className="hidden sm:inline text-xs text-gray-400">
              {session?.companyProfile} • {session?.targetRole}
            </span>

            {session?.mode === "practice" && (
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                Practice Mode
              </span>
            )}
          </div>

          {/* Controls: Timer, Pause, End */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Session Timer */}
            <div className="flex items-center gap-1.5 rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs font-mono font-medium text-gray-200">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Pause/Resume */}
            <button
              onClick={handleTogglePause}
              className="flex items-center gap-1 rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition"
              title={isPaused ? "Resume Interview" : "Pause Interview"}
            >
              {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
            </button>

            {/* End Interview */}
            <button
              onClick={handleEndInterview}
              disabled={submitting}
              className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition"
            >
              <Square className="h-3.5 w-3.5 fill-red-400" />
              <span className="hidden sm:inline">End Interview</span>
            </button>
          </div>
        </div>

        {/* 4 Rounds Progress Stepper */}
        <div className="mx-auto max-w-7xl pt-2">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(r => {
              const roundInfo = rounds.find(rnd => rnd.roundNumber === r);
              const isCurrent = r === currentRoundNum;
              const isDone = roundInfo?.status === "completed";
              return (
                <div
                  key={r}
                  className={`h-1.5 rounded-full transition-all ${
                    isDone
                      ? "bg-emerald-500"
                      : isCurrent
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-800"
                  }`}
                  title={`Round ${r}: ${ROUND_NAMES[r as RoundNumber]} (${roundInfo?.status || "pending"})`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((m, idx) => {
            const isInterviewer = m.sender === "interviewer";
            const isCandidate = m.sender === "candidate";
            const isSystem = m.sender === "system";

            if (isSystem) {
              return (
                <div key={m.id || idx} className="flex justify-center my-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/60 px-3 py-1 text-[11px] text-gray-400">
                    <Info className="h-3 w-3 text-blue-400" />
                    <span>{m.content}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id || idx}
                className={`flex gap-3 ${isCandidate ? "justify-end" : "justify-start"}`}
              >
                {/* Interviewer Avatar */}
                {isInterviewer && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed space-y-1.5 shadow-sm ${
                    isCandidate
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "border border-gray-800 bg-gray-900/90 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {/* Sender Tag */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-semibold opacity-75">
                    <span>
                      {isCandidate ? "You (Candidate)" : `Interviewer (${session?.companyProfile})`}
                    </span>
                    {m.messageType === "clarification_question" && (
                      <span className="rounded bg-amber-400/20 px-1 text-amber-300">Clarification</span>
                    )}
                    {m.messageType === "clarification_answer" && (
                      <span className="rounded bg-cyan-400/20 px-1 text-cyan-300">Answer to Clarification</span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                  {/* Round 3 Coding Action Banner inside chat */}
                  {isInterviewer && currentRoundNum === 3 && (
                    <div className="pt-2 border-t border-gray-800/80 mt-2">
                      <Link
                        href={`/coding?sessionId=${sessionId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                        <span>Open Coding Arena (Monaco Editor & Test Cases)</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Candidate Avatar */}
                {isCandidate && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-gray-800 text-gray-300 border border-gray-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {submitting && (
            <div className="flex gap-3 justify-start items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/90 px-4 py-2.5 text-xs text-gray-400 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                <span>Interviewer is evaluating your response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Candidate Input Toolbar & Action Area */}
      <div className="border-t border-gray-800 bg-gray-950/90 p-4">
        <div className="mx-auto max-w-3xl space-y-2">
          {/* Helper toolbar */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400">
              Press Enter or click Submit to send your answer.
            </span>

            {/* Candidate Interruption / Clarification Button */}
            <button
              type="button"
              onClick={() => setIsClarifyOpen(true)}
              disabled={submitting || isPaused}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Ask Interviewer for Clarification</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitAnswer} className="flex gap-2">
            <textarea
              rows={2}
              value={answerInput}
              onChange={e => setAnswerInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAnswer(e);
                }
              }}
              disabled={submitting || isPaused}
              placeholder={
                isPaused
                  ? "Interview is paused. Click Resume in the header to proceed."
                  : currentRoundNum === 3
                  ? "Explain your algorithmic approach here, or click 'Open Coding Arena' to write and compile code..."
                  : "Type your structured answer here (explain principles, trade-offs, and examples)..."
              }
              className="flex-1 rounded-xl border border-gray-800 bg-gray-900/80 p-3 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
            />

            <button
              type="submit"
              disabled={submitting || !answerInput.trim() || isPaused}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-500 disabled:opacity-40 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Candidate Clarification Modal */}
      {isClarifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-400" />
                <span>Ask Interviewer for Clarification</span>
              </h3>
              <button
                onClick={() => setIsClarifyOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Asking questions does <strong className="text-white">NOT</strong> count as an answer or penalize your score.
              You can ask about input constraints, boundary edge cases, expected formats, or clarify ambiguous assumptions.
            </p>

            <form onSubmit={handleAskInterviewer} className="space-y-4">
              <textarea
                rows={3}
                value={clarifyQuestion}
                onChange={e => setClarifyQuestion(e.target.value)}
                placeholder="e.g. 'Can I assume all array elements are positive integers?' or 'Should this be thread-safe?'"
                required
                className="w-full rounded-lg border border-gray-800 bg-gray-950 p-3 text-xs text-white placeholder-gray-500 focus:border-amber-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClarifyOpen(false)}
                  className="rounded-lg border border-gray-800 px-3.5 py-2 text-xs font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clarifying || !clarifyQuestion.trim()}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {clarifying ? "Asking Interviewer..." : "Ask Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
