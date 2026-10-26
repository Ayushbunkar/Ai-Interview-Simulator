"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Editor from "@monaco-editor/react";
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
  Volume2,
  Flame,
  Terminal,
  Check,
  XCircle,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { ROUND_NAMES } from "@/lib/interview/engine";
import { RoundNumber, VoiceState } from "@/lib/types";
import { VoiceSessionController } from "@/lib/voice/voice-session-controller";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { LiveTranscriptPanel } from "@/components/voice/LiveTranscriptPanel";

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
  primaryLanguage: "java" | "python" | "cpp";
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

  // Voice State Machine & Controller
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(true);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Clarification / Interruption Modal State
  const [isClarifyOpen, setIsClarifyOpen] = useState(false);
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifying, setClarifying] = useState(false);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [isPaused, setIsPaused] = useState(false);

  // Round 3 Monaco Coding Workspace State
  const [codingProblem, setCodingProblem] = useState<any | null>(null);
  const [codingLanguage, setCodingLanguage] = useState<"java" | "python" | "cpp">("java");
  const [code, setCode] = useState<string>("");
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [activeCodingTab, setActiveCodingTab] = useState<"problem" | "console">("problem");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceControllerRef = useRef<VoiceSessionController | null>(null);

  // Initialize Voice Session Controller
  useEffect(() => {
    const controller = new VoiceSessionController({
      onStateChange: (newState) => {
        setVoiceState(newState);
      },
      onInterimTranscript: (interim) => {
        setInterimTranscript(interim);
      },
      onFinalTranscript: (final) => {
        setFinalTranscript(final);
      },
      onError: (msg) => {
        setVoiceError(msg);
      },
    });

    voiceControllerRef.current = controller;

    return () => {
      controller.stopSpeaking();
      controller.stopListening();
    };
  }, []);

  // Fetch session data
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
        return;
      }

      // If in Round 3, fetch current coding challenge
      if (data.session.currentRound === 3) {
        loadCodingProblemForSession(data.messages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load session");
      setLoading(false);
    }
  };

  const loadCodingProblemForSession = async (currentMessages: Message[]) => {
    // Check if question message has problem metadata
    const codingMsg = [...currentMessages]
      .reverse()
      .find(m => m.roundNumber === 3 && m.sender === "interviewer");

    let slug = "two-sum";
    if (codingMsg) {
      try {
        const meta = (codingMsg as any).metadata ? JSON.parse((codingMsg as any).metadata) : {};
        if (meta.problemSlug) slug = meta.problemSlug;
      } catch {
        // Default
      }
    }

    try {
      const pRes = await fetch(`/api/coding/problems/${slug}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setCodingProblem(pData.problem);
        setCodingLanguage(session?.primaryLanguage || "java");
        setCode(pData.problem.starterCode[session?.primaryLanguage || "java"] || "");
      }
    } catch (err) {
      console.warn("Could not fetch coding problem details:", err);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Automatically speak new interviewer questions if voice mode is on
  useEffect(() => {
    if (!loading && messages.length > 0 && isVoiceMode && voiceControllerRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "interviewer" && lastMsg.messageType === "question") {
        voiceControllerRef.current.speakInterviewerMessage(lastMsg.id, lastMsg.content);
      }
    }
  }, [messages, loading, isVoiceMode]);

  // Live countdown timer
  useEffect(() => {
    if (isPaused || loading || !session || session.status === "completed") return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loading, session]);

  // Handle Candidate Answer Submission (Spoken or Typed)
  const handleSubmitAnswer = async (submittedText: string) => {
    if (!submittedText.trim() || submitting) return;

    setSubmitting(true);
    setVoiceError(null);
    voiceControllerRef.current?.notifySubmissionStarted();

    // Optimistic candidate message
    const tempMsgId = "temp-" + Date.now();
    setMessages(prev => [
      ...prev,
      {
        id: tempMsgId,
        roundNumber: session?.currentRound || 1,
        sender: "candidate",
        messageType: "answer",
        content: submittedText.trim(),
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/interviews/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: submittedText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");

      // Refetch latest session messages and rounds
      await fetchSession();

      // Clear voice transcripts
      setInterimTranscript("");
      setFinalTranscript("");
      setManualText("");
    } catch (err: any) {
      setError(err.message);
      setVoiceError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Candidate Clarification / Interruption
  const handleAskInterviewer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

      // Read aloud the interviewer's clarification reply
      if (data.interviewerReply && isVoiceMode && voiceControllerRef.current) {
        voiceControllerRef.current.speakInterviewerMessage("clarify-" + Date.now(), data.interviewerReply);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClarifying(false);
    }
  };

  // Run Code in Monaco Editor (Round 3)
  const handleRunCode = async () => {
    if (!codingProblem || isRunningCode) return;
    setIsRunningCode(true);
    setRunResult(null);
    setActiveCodingTab("console");

    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: codingLanguage,
          code,
          problemSlug: codingProblem.slug,
          stdin: codingProblem.visibleTestCases[0]?.input || "",
        }),
      });

      const data = await res.json();
      setRunResult(data);
    } catch (err: any) {
      setRunResult({ success: false, error: err.message });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Code Solution (Round 3)
  const handleSubmitCode = async () => {
    if (!codingProblem || isSubmittingCode) return;
    setIsSubmittingCode(true);
    setSubmitResult(null);
    setActiveCodingTab("console");

    try {
      const res = await fetch("/api/coding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug: codingProblem.slug,
          language: codingLanguage,
          code,
          sessionId,
        }),
      });

      const data = await res.json();
      setSubmitResult(data);

      if (data.status === "accepted") {
        // Automatically submit candidate notification to interview engine
        await handleSubmitAnswer(
          `I have completed and verified my solution in ${codingLanguage.toUpperCase()}. All test cases passed with optimal complexity.`
        );
      }
    } catch (err: any) {
      setSubmitResult({ error: err.message });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Explain Approach Aloud or via Text Before Coding
  const [isExplainingApproach, setIsExplainingApproach] = useState(false);
  const handleExplainApproach = async () => {
    if (!codingProblem || isExplainingApproach) return;
    setIsExplainingApproach(true);
    try {
      const approachText = manualText.trim() || finalTranscript.trim() || "Candidate is explaining initial approach for " + codingProblem.title;
      await fetch("/api/coding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          problemId: codingProblem.id,
          stepType: "initial_approach",
          content: approachText,
          metadata: { language: codingLanguage },
        }),
      });

      if (manualText.trim() || finalTranscript.trim()) {
        await handleSubmitAnswer(`Here is my algorithmic approach before coding:\n\n${approachText}`);
      } else {
        // Prompt candidate to speak into mic
        if (voiceControllerRef.current?.isVoiceMode()) {
          voiceControllerRef.current.speakInterviewerMessage(
            "explain-prompt-" + Date.now(),
            `Please go ahead and explain your approach for ${codingProblem.title}. What data structures and algorithm will you use, and what is your expected time and space complexity?`
          );
        }
      }
    } catch (err: any) {
      console.warn("Could not log approach step:", err);
    } finally {
      setIsExplainingApproach(false);
    }
  };

  // Toggle Pause
  const handleTogglePause = async () => {
    const endpoint = isPaused ? "resume" : "pause";
    try {
      const res = await fetch(`/api/interviews/${sessionId}/${endpoint}`, {
        method: "POST",
      });
      if (res.ok) {
        setIsPaused(!isPaused);
        if (!isPaused) {
          voiceControllerRef.current?.stopSpeaking();
          voiceControllerRef.current?.stopListening();
        }
        await fetchSession();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // End Interview Early
  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end this interview now? A performance report will be generated based on your answers and submissions so far.")) {
      return;
    }
    setSubmitting(true);
    voiceControllerRef.current?.stopSpeaking();
    voiceControllerRef.current?.stopListening();

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
          <p className="text-xs text-muted-foreground">Connecting to InterviewForge AI Interview Room...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Interview Session Error</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link href="/" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCodingRound = session?.currentRound === 3;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-4 gap-4">
      {/* Top Header Bar: Round status, timer, pause, end */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
            R{session?.currentRound || 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm text-foreground">
                Round {session?.currentRound}: {ROUND_NAMES[session?.currentRound || 1]}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-muted text-muted-foreground">
                {session?.mode}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {session?.companyProfile} • {session?.targetRole}
            </p>
          </div>
        </div>

        {/* Round Progress Tracker */}
        <div className="hidden md:flex items-center gap-2">
          {rounds.map((r) => (
            <div
              key={r.roundNumber}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                r.roundNumber === session?.currentRound
                  ? "bg-blue-600 text-white"
                  : r.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {r.status === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span>{r.roundNumber}</span>
              )}
              <span className="hidden lg:inline">{r.roundName.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Controls: Timer, Pause, End */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-semibold">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={handleTogglePause}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-500" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            type="button"
            onClick={handleEndInterview}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium transition-all"
          >
            <Square className="h-3.5 w-3.5" />
            End Interview
          </button>
        </div>
      </header>

      {/* Main Interview Body: Split Layout if Round 3 (Coding), Single Column otherwise */}
      <div className={`grid gap-4 flex-1 overflow-hidden ${isCodingRound ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Left Column: Voice Interview Conversation & Transcript */}
        <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Voice Action & Status Bar */}
          <div className="p-3 border-b border-border bg-muted/30">
            {voiceControllerRef.current && (
              <VoiceControls
                voiceState={voiceState}
                isVoiceMode={isVoiceMode}
                onToggleVoiceMode={() => {
                  const next = !isVoiceMode;
                  setIsVoiceMode(next);
                  voiceControllerRef.current?.setVoiceMode(next);
                }}
                onStartListening={() => voiceControllerRef.current?.startListening()}
                onStopListening={() => voiceControllerRef.current?.stopListening()}
                onStopSpeaking={() => voiceControllerRef.current?.stopSpeaking()}
                onReplayQuestion={() => {
                  const lastQ = [...messages].reverse().find(m => m.sender === "interviewer");
                  if (lastQ) voiceControllerRef.current?.replayCurrentQuestion(lastQ.content);
                }}
                onInterrupt={() => {
                  voiceControllerRef.current?.interruptInterviewer();
                  setIsClarifyOpen(true);
                }}
                synthesizer={voiceControllerRef.current.getSpeechSynthesizer()}
                errorMessage={voiceError}
              />
            )}
          </div>

          {/* Messages History Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "candidate" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === "candidate"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                  }`}
                >
                  {msg.sender === "candidate" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.sender === "candidate"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-muted/60 border border-border text-foreground rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-medium">
                    <span>{msg.sender === "candidate" ? "Candidate (You)" : "AI Interviewer"}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Live Transcript / Candidate Input Box */}
          <div className="p-3 border-t border-border bg-card">
            <LiveTranscriptPanel
              voiceState={voiceState}
              interimTranscript={interimTranscript}
              finalTranscript={finalTranscript}
              onSubmit={handleSubmitAnswer}
              submitting={submitting}
              manualText={manualText}
              setManualText={setManualText}
            />
          </div>
        </div>

        {/* Right Column (Round 3 ONLY): Monaco Code Editor & Compiler Output */}
        {isCodingRound && (
          <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Header: Tabs & Language Selector */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveCodingTab("problem")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCodingTab === "problem"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Problem & Instructions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodingTab("console")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCodingTab === "console"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Compiler Console & Tests
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={codingLanguage}
                  onChange={(e) => {
                    const l = e.target.value as "java" | "python" | "cpp";
                    setCodingLanguage(l);
                    if (codingProblem?.starterCode?.[l]) {
                      setCode(codingProblem.starterCode[l]);
                    }
                  }}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium"
                >
                  <option value="java">Java (OpenJDK 25)</option>
                  <option value="python">Python 3.14</option>
                  <option value="cpp">C++ (GCC 15)</option>
                </select>

                <button
                  type="button"
                  onClick={handleExplainApproach}
                  disabled={isExplainingApproach}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition-colors"
                  title="Explain algorithmic approach and complexity before writing code"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-purple-400" />
                  <span>Explain Approach</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunningCode || isSubmittingCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-500" />
                  {isRunningCode ? "Running..." : "Run Code"}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={isSubmittingCode || isRunningCode}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isSubmittingCode ? "Testing..." : "Submit Code"}
                </button>
              </div>
            </div>

            {/* Coding Pane Content: Problem Description OR Console */}
            {activeCodingTab === "problem" && codingProblem && (
              <div className="p-4 border-b border-border bg-muted/20 text-xs overflow-y-auto max-h-48 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">{codingProblem.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-500/10 text-blue-500">
                    {codingProblem.difficulty}
                  </span>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{codingProblem.description}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {codingProblem.constraints?.map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Monaco Editor Pane */}
            <div className="flex-1 min-h-[300px]">
              <Editor
                height="100%"
                language={codingLanguage === "cpp" ? "cpp" : codingLanguage}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  tabSize: 2,
                }}
              />
            </div>

            {/* Console Output Drawer */}
            {activeCodingTab === "console" && (
              <div className="p-3 border-t border-border bg-slate-950 text-slate-100 font-mono text-xs max-h-48 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                  <span>Execution Output</span>
                  {runResult?.time && <span>Duration: {runResult.time}s</span>}
                </div>

                {runResult?.configured === false && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans">
                    <strong>Code Execution Disabled:</strong> OnlineCompiler API is not configured. Set <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">ONLINECOMPILER_API_KEY</code> in Settings or <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">.env.local</code> to execute code live. Fake compiler results are never generated.
                  </div>
                )}

                {submitResult?.configured === false && (
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans">
                    <strong>Evaluation Disabled:</strong> Real test-case execution requires <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">ONLINECOMPILER_API_KEY</code>.
                  </div>
                )}

                {runResult?.stdout && (
                  <div>
                    <span className="text-emerald-400 font-semibold">Standard Output:</span>
                    <pre className="whitespace-pre-wrap mt-1">{runResult.stdout}</pre>
                  </div>
                )}

                {runResult?.compileOutput && (
                  <div>
                    <span className="text-red-400 font-semibold">Compiler Output:</span>
                    <pre className="whitespace-pre-wrap mt-1 text-red-300">{runResult.compileOutput}</pre>
                  </div>
                )}

                {submitResult && (
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-xs">
                        {submitResult.status === "accepted" ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Accepted ({submitResult.passedCount}/{submitResult.totalCount} tests passed)
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> {submitResult.status} ({submitResult.passedCount}/{submitResult.totalCount} tests passed)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interruption / Clarification Modal */}
      {isClarifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Ask Interviewer / Interruption</h3>
                <p className="text-xs text-muted-foreground">
                  Ask for clarification, constraints, or assumptions without advancing the interview or penalty.
                </p>
              </div>
            </div>

            <form onSubmit={handleAskInterviewer} className="space-y-3">
              <div className="flex flex-wrap gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setClarifyQuestion("Could you please repeat the question?")}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition"
                >
                  Repeat Question
                </button>
                <button
                  type="button"
                  onClick={() => setClarifyQuestion("Could you please rephrase this question from an intuitive perspective?")}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition"
                >
                  Rephrase Question
                </button>
                <button
                  type="button"
                  onClick={() => setClarifyQuestion("Could you give me a small directional hint on the optimal approach?")}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition"
                >
                  Request Hint
                </button>
                <button
                  type="button"
                  onClick={() => setClarifyQuestion("Could you clarify the input scale bounds and whether inputs can be null or empty?")}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition"
                >
                  Clarify Constraints
                </button>
              </div>

              <textarea
                value={clarifyQuestion}
                onChange={(e) => setClarifyQuestion(e.target.value)}
                placeholder="Or type your specific question: e.g. Could you clarify if input contains duplicate elements? Can we assume single-threaded execution?"
                rows={3}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClarifyOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clarifying || !clarifyQuestion.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {clarifying ? "Inquiring..." : "Ask Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
