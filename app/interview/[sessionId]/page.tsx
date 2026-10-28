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
  MessageSquare,
  RotateCcw,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { ROUND_NAMES } from "@/lib/interview/engine";
import { RoundNumber, VoiceState } from "@/lib/types";
import { VoiceSessionController } from "@/lib/voice/voice-session-controller";
import { VoiceControls } from "@/components/voice/VoiceControls";
import { LiveTranscriptPanel } from "@/components/voice/LiveTranscriptPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const [isWhisperRecording, setIsWhisperRecording] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

  // Clarification / Interruption Modal State
  const [isClarifyOpen, setIsClarifyOpen] = useState(false);
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifying, setClarifying] = useState(false);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Round 3 Monaco Coding Workspace State
  const [codingProblem, setCodingProblem] = useState<any | null>(null);
  const [codingLanguage, setCodingLanguage] = useState<"java" | "python" | "cpp">("java");
  const [code, setCode] = useState<string>("");
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<"problem" | "voice" | "hints">("problem");
  const [activeConsoleTab, setActiveConsoleTab] = useState<"terminal" | "tests">("terminal");
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

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

  // Silence auto-completion & turn tracking refs
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartedForMsgIdRef = useRef<string | null>(null);
  const userManuallyPausedRef = useRef<boolean>(false);

  // Automatically activate live microphone listening ONCE when it's candidate's turn to answer
  useEffect(() => {
    if (loading || isPaused || submitting || !isVoiceMode || !voiceControllerRef.current) return;
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === "interviewer") {
      // Check if we haven't already auto-started for this specific interviewer message
      if (lastMsg.id !== autoStartedForMsgIdRef.current) {
        const controller = voiceControllerRef.current;
        if (controller.getState() === "idle" && !controller.isInterviewerSpeaking() && !userManuallyPausedRef.current) {
          autoStartedForMsgIdRef.current = lastMsg.id;
          controller.startListening(true);
        }
      }
    }
  }, [messages, loading, isPaused, submitting, isVoiceMode]);

  // Done Speaking handler: stops microphone and immediately submits transcribed answer
  const handleDoneSpeaking = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(null);

    voiceControllerRef.current?.stopListening();

    const spoken = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
    const textToSubmit = spoken || manualText.trim();
    if (textToSubmit) {
      handleSubmitAnswer(textToSubmit);
    }
  };

  // Pause listening: explicitly keeps mic paused so user can review/edit without auto-restart
  const handleStopListening = () => {
    userManuallyPausedRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(null);
    voiceControllerRef.current?.stopListening();
  };

  // Start listening: candidate manually unpauses microphone
  const handleStartListening = () => {
    userManuallyPausedRef.current = false;
    voiceControllerRef.current?.startListening(true);
  };

  // Cancel silence countdown if candidate wants to continue speaking or editing
  const handleCancelSilenceCountdown = () => {
    userManuallyPausedRef.current = true;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(null);
  };

  // Smart Silence Detection: when candidate finishes speaking and is silent for 3.5s, countdown and auto-submit
  useEffect(() => {
    if (submitting || !isVoiceMode || (voiceState !== "ready_to_listen" && voiceState !== "user_speaking")) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setSilenceCountdown(null);
      return;
    }

    const currentText = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim() || manualText.trim();
    const wordCount = currentText.split(/\s+/).filter(Boolean).length;

    // Reset countdown if new speech/words arrive
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(null);

    // Only initiate silence auto-completion if candidate has spoken at least 4 words
    if (wordCount >= 4 && !userManuallyPausedRef.current) {
      silenceTimerRef.current = setTimeout(() => {
        let count = 3;
        setSilenceCountdown(count);
        countdownIntervalRef.current = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setSilenceCountdown(null);
            handleDoneSpeaking();
          } else {
            setSilenceCountdown(count);
          }
        }, 1000);
      }, 3500);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [finalTranscript, interimTranscript, manualText, voiceState, submitting, isVoiceMode]);

  // Live countdown timer
  useEffect(() => {
    if (isPaused || loading || !session || session.status === "completed") return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, loading, session]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle Candidate Answer Submission (Spoken or Typed)
  const handleSubmitAnswer = async (submittedText: string) => {
    if (!submittedText.trim() || submitting) return;

    // Reset turn flags & silence countdowns
    autoStartedForMsgIdRef.current = null;
    userManuallyPausedRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(null);

    setSubmitting(true);
    setVoiceError(null);
    setError(null);
    voiceControllerRef.current?.stopListening();
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

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`/api/interviews/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: submittedText.trim() }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");

      // Refetch latest session messages and rounds
      await fetchSession();

      // Clear voice transcripts only upon verified success
      setError(null);
      setInterimTranscript("");
      setFinalTranscript("");
      setManualText("");
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Evaluation request was cancelled. Your draft was safely preserved.");
      } else {
        setError(err.message || "Failed to evaluate answer.");
        setVoiceError(err.message);
      }
      // Preserve candidate text in input
      setManualText(submittedText.trim());
    } finally {
      setSubmitting(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSubmission = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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

  // Whisper Audio Recording Handlers (Reliable Cloud Speech-to-Text Fallback)
  const handleStartWhisperRecording = async () => {
    if (!voiceControllerRef.current) return;
    setVoiceError(null);
    const started = await voiceControllerRef.current.startWhisperRecording();
    if (started) {
      setIsWhisperRecording(true);
    }
  };

  const handleStopWhisperRecording = async () => {
    if (!voiceControllerRef.current) return;
    setIsWhisperRecording(false);
    setIsTranscribingAudio(true);
    try {
      const text = await voiceControllerRef.current.stopAndTranscribeWhisper();
      if (text) {
        setFinalTranscript((prev) => (prev ? prev + " " + text : text));
        setManualText((prev) => (prev ? prev + " " + text : text));
        setVoiceError(null);
      }
    } catch (err: any) {
      setVoiceError(err.message || "Failed to transcribe audio.");
    } finally {
      setIsTranscribingAudio(false);
    }
  };

  // Run Code in Monaco Editor (Round 3)
  const handleRunCode = async () => {
    if (!codingProblem || isRunningCode) return;
    setIsRunningCode(true);
    setRunResult(null);
    setActiveConsoleTab("terminal");

    try {
      const res = await fetch("/api/coding/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: codingLanguage,
          code,
          problemSlug: codingProblem.slug,
          stdin: codingProblem.visibleTestCases?.[0]?.input || "",
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
    setActiveConsoleTab("tests");

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

  const handleResetCode = () => {
    if (codingProblem?.starterCode?.[codingLanguage]) {
      setCode(codingProblem.starterCode[codingLanguage]);
    }
  };

  const toggleHint = (idx: number) => {
    setRevealedHints(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
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

  // Advance to Next Round or Target Round
  const handleAdvanceRound = async (targetRound?: number) => {
    try {
      setLoading(true);
      voiceControllerRef.current?.stopSpeaking();
      voiceControllerRef.current?.stopListening();

      const res = await fetch(`/api/interviews/${sessionId}/advance-round`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRound }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance round");

      if (data.reportId) {
        router.push(`/reports/${data.reportId}`);
        return;
      }

      await fetchSession();
    } catch (err: any) {
      setError(err.message || "Failed to advance round");
      setLoading(false);
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
    <ErrorBoundary fallbackTitle="Interview Room Interface Recovery">
      <div className={`flex flex-col mx-auto p-2 sm:p-4 gap-3 ${
        isCodingRound
          ? "h-[calc(100vh-4.25rem)] max-w-[1720px] overflow-hidden"
          : "min-h-[calc(100vh-4rem)] max-w-5xl pb-12"
      }`}>
      {/* Top Header Bar: Round status, timer, pause, end */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl glass-panel shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30 shadow-sm shadow-blue-500/10">
            R{session?.currentRound || 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
                Round {session?.currentRound}: {ROUND_NAMES[session?.currentRound || 1]}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/25">
                {session?.mode}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {session?.companyProfile} • {session?.targetRole}
            </p>
          </div>
        </div>

        {/* Round Progress Tracker (Clickable to jump to round) */}
        <div className="hidden md:flex items-center gap-2">
          {rounds.map((r) => (
            <button
              key={r.roundNumber}
              type="button"
              onClick={() => {
                if (r.roundNumber !== session?.currentRound) {
                  handleAdvanceRound(r.roundNumber);
                }
              }}
              title={
                r.roundNumber === session?.currentRound
                  ? "Current active round"
                  : `Jump to Round ${r.roundNumber}: ${r.roundName}`
              }
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                r.roundNumber === session?.currentRound
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/25 cursor-default"
                  : r.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer hover:scale-[1.02]"
                  : "bg-muted/60 text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground cursor-pointer hover:scale-[1.02]"
              }`}
            >
              {r.status === "completed" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <span className="font-bold">{r.roundNumber}</span>
              )}
              <span className="hidden lg:inline">{r.roundName.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Controls: Timer, Pause, Next Round, End */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-mono font-semibold shadow-sm ${
            isPaused
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : secondsRemaining <= 300
              ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
              : "border-border/80 bg-card/80 text-foreground"
          }`}>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            type="button"
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm ${
              isPaused
                ? "border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                : "border-border/80 bg-card/80 hover:bg-muted text-foreground"
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {session?.currentRound && session.currentRound < 4 && (
            <button
              type="button"
              onClick={() => handleAdvanceRound()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-blue-300 text-xs font-semibold shadow-sm shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Finish current round and advance to next round"
            >
              <span>Next Round</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleEndInterview}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Square className="h-3.5 w-3.5" />
            <span>End Interview</span>
          </button>
        </div>
      </header>

      {/* Paused Notification Banner (Prominent & Clear) */}
      {isPaused && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-4 flex flex-wrap items-center justify-between gap-3 text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Pause className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-amber-100">Interview Currently Paused</h4>
              <p className="text-xs text-amber-300/80">The countdown timer and active microphone capture are suspended. Click Resume whenever you are ready to continue.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTogglePause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition"
          >
            <Play className="h-4 w-4 fill-white" />
            Resume Interview
          </button>
        </div>
      )}

      {/* Main Interview Body: Specialized Split-Pane IDE for Round 3 (Coding), Clean Conversational Stage for Rounds 1, 2, 4 */}
      {isCodingRound ? (
        /* Full-width Split-Pane Coding Arena */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 h-[calc(100vh-160px)]">
          {/* Left Column: Problem, Chat & Hints Tabs */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm h-full">
            {/* Left Header Tabs */}
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-xs shrink-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveLeftTab("problem")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLeftTab === "problem"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Problem</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab("voice")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLeftTab === "voice"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Bot className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Interviewer & Voice</span>
                  {messages.length > 0 && (
                    <span className="rounded-full bg-blue-500/20 text-blue-400 px-1.5 py-0.2 text-[10px]">
                      {messages.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLeftTab("hints")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeLeftTab === "hints"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span>Hints ({codingProblem?.hints?.length || 0})</span>
                </button>
              </div>

              {codingProblem && (
                <Link
                  href={`/coding?slug=${codingProblem.slug}&sessionId=${sessionId}`}
                  target="_blank"
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition"
                  title="Open Dedicated Fullscreen Coding Arena"
                >
                  <span>Arena</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Left Body Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeLeftTab === "problem" && (
                codingProblem ? (
                  <div className="space-y-4">
                    <div className="space-y-2 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-foreground">{codingProblem.title}</h2>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            codingProblem.difficulty === "easy"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : codingProblem.difficulty === "medium"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {codingProblem.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {codingProblem.topicTags?.map((tag: string) => (
                          <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-xs font-semibold text-foreground">Problem Description</h3>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                        {codingProblem.description}
                      </p>
                    </div>

                    {codingProblem.examples && codingProblem.examples.length > 0 && (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-semibold text-foreground">Examples</h3>
                        {codingProblem.examples.map((ex: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-muted/40 border border-border/80 p-3 font-mono space-y-1 text-[11px]">
                            <div className="font-semibold text-foreground/80">Example {idx + 1}:</div>
                            <div><span className="text-blue-400 font-semibold">Input:</span> {ex.input}</div>
                            <div><span className="text-emerald-400 font-semibold">Output:</span> {ex.output}</div>
                            {ex.explanation && (
                              <div className="text-muted-foreground font-sans text-[11px] pt-0.5">
                                <span className="font-semibold text-foreground/70 font-mono">Explanation:</span> {ex.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {codingProblem.constraints && codingProblem.constraints.length > 0 && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-semibold text-foreground">Constraints</h3>
                        <ul className="list-disc pl-4 space-y-1 font-mono text-[11px] text-muted-foreground">
                          {codingProblem.constraints.map((c: string, idx: number) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground space-y-2">
                    <Code2 className="h-8 w-8 mx-auto text-blue-400 animate-pulse" />
                    <p className="font-medium text-xs">Loading coding challenge...</p>
                  </div>
                )
              )}

              {activeLeftTab === "voice" && (
                <div className="space-y-3">
                  {/* Spotlight Interviewer Question */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5" />
                        AI Technical Interviewer
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const lastQ = [...messages].reverse().find(m => m.sender === "interviewer");
                          if (lastQ) voiceControllerRef.current?.replayCurrentQuestion(lastQ.content);
                        }}
                        className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1"
                      >
                        <Volume2 className="h-3 w-3" />
                        Replay
                      </button>
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {(() => {
                        const qMsg = [...messages].reverse().find(m => m.sender === "interviewer" && m.messageType === "question");
                        return qMsg?.content || "Candidate, please implement the algorithmic solution in the code editor on the right.";
                      })()}
                    </p>
                  </div>

                  {/* Voice Controls */}
                  {voiceControllerRef.current && (
                    <VoiceControls
                      voiceState={voiceState}
                      isVoiceMode={isVoiceMode}
                      onToggleVoiceMode={() => {
                        const next = !isVoiceMode;
                        setIsVoiceMode(next);
                        voiceControllerRef.current?.setVoiceMode(next);
                        if (next) {
                          handleStartListening();
                        } else {
                          handleStopListening();
                        }
                      }}
                      onStartListening={handleStartListening}
                      onStopListening={handleStopListening}
                      onDoneSpeaking={handleDoneSpeaking}
                      silenceCountdown={silenceCountdown}
                      onCancelSilenceCountdown={handleCancelSilenceCountdown}
                      onStopSpeaking={() => voiceControllerRef.current?.stopSpeaking()}
                      onReplayQuestion={() => {
                        const lastQ = [...messages].reverse().find(m => m.sender === "interviewer");
                        if (lastQ) voiceControllerRef.current?.replayCurrentQuestion(lastQ.content);
                      }}
                      onInterrupt={() => {
                        voiceControllerRef.current?.interruptInterviewer();
                        setIsClarifyOpen(true);
                      }}
                      onStartWhisperRecording={handleStartWhisperRecording}
                      onStopWhisperRecording={handleStopWhisperRecording}
                      isWhisperRecording={isWhisperRecording}
                      isTranscribingAudio={isTranscribingAudio}
                      synthesizer={voiceControllerRef.current.getSpeechSynthesizer()}
                      errorMessage={voiceError}
                    />
                  )}

                  {/* Live Transcript / Answer Box */}
                  <LiveTranscriptPanel
                    voiceState={voiceState}
                    interimTranscript={interimTranscript}
                    finalTranscript={finalTranscript}
                    onSubmit={handleSubmitAnswer}
                    onDoneSpeaking={handleDoneSpeaking}
                    silenceCountdown={silenceCountdown}
                    onCancelSilenceCountdown={handleCancelSilenceCountdown}
                    submitting={submitting}
                    manualText={manualText}
                    setManualText={setManualText}
                    errorMessage={error}
                    onCancelSubmission={handleCancelSubmission}
                    isTranscribingAudio={isTranscribingAudio}
                  />

                  {/* Collapsible History */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Recent Dialogue</span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {messages.slice(-4).map((msg) => (
                        <div key={msg.id} className={`p-2 rounded-lg text-[11px] leading-snug ${
                          msg.sender === "candidate" ? "bg-blue-600/20 text-blue-200 border border-blue-500/30" : "bg-muted text-foreground"
                        }`}>
                          <strong className="block text-[10px] opacity-75">{msg.sender === "candidate" ? "You" : "Interviewer"}:</strong>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === "hints" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                        Guided Problem Hints
                      </h3>
                      <button
                        type="button"
                        onClick={handleExplainApproach}
                        className="rounded-lg bg-purple-600/20 border border-purple-500/30 px-2 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-600/30"
                      >
                        Explain Approach
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Try to solve the problem before unlocking hints.
                    </p>
                  </div>

                  {codingProblem?.hints && codingProblem.hints.length > 0 ? (
                    <div className="space-y-2">
                      {codingProblem.hints.map((hint: string, idx: number) => {
                        const isRevealed = revealedHints.includes(idx);
                        return (
                          <div key={idx} className="rounded-xl border border-border bg-muted/40 p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground text-[11px]">Hint {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => toggleHint(idx)}
                                className="text-[10px] font-medium text-amber-400 hover:underline"
                              >
                                {isRevealed ? "Hide Hint" : "Reveal Hint"}
                              </button>
                            </div>
                            {isRevealed && (
                              <p className="text-muted-foreground text-xs leading-relaxed animate-in fade-in">
                                {hint}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">No explicit hints available for this problem.</p>
                  )}

                  {codingProblem?.timeComplexity && (
                    <div className="rounded-xl border border-border bg-card p-3 space-y-1 text-[11px]">
                      <div className="font-semibold text-foreground">Target Complexity Benchmarks:</div>
                      <div>Time: <span className="font-mono text-emerald-400">{codingProblem.timeComplexity}</span></div>
                      <div>Space: <span className="font-mono text-emerald-400">{codingProblem.spaceComplexity || "O(1)"}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Editor & Live Console Output */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm h-full">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs shrink-0">
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
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold text-emerald-400 focus:outline-none"
                >
                  <option value="java">Java (OpenJDK 25)</option>
                  <option value="python">Python 3.14</option>
                  <option value="cpp">C++ (GCC 15)</option>
                </select>

                <button
                  type="button"
                  onClick={handleResetCode}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title="Reset to starter template"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExplainApproach}
                  disabled={isExplainingApproach}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-medium transition"
                  title="Explain algorithmic approach before coding"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-purple-400" />
                  <span className="hidden sm:inline">{isExplainingApproach ? "Explaining..." : "Explain Approach"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={isRunningCode || isSubmittingCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition disabled:opacity-50"
                  title="Run code against sample test cases"
                >
                  <Play className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{isRunningCode ? "Running..." : "Run Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitCode}
                  disabled={isSubmittingCode || isRunningCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                  title="Submit code for full evaluation"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isSubmittingCode ? "Testing..." : "Submit Solution"}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor (Fill middle available space) */}
            <div className="flex-1 min-h-[260px] relative bg-[#1e1e1e] overflow-hidden">
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
                  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
                }}
              />
            </div>

            {/* Bottom Output / Tests Drawer */}
            <div className="h-44 border-t border-border bg-slate-950 flex flex-col shrink-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("terminal")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                      activeConsoleTab === "terminal" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Terminal className="h-3 w-3 text-emerald-400" />
                    <span>Console Output</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab("tests")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition ${
                      activeConsoleTab === "tests" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    <span>Test Cases {submitResult ? `(${submitResult.passedCount ?? 0}/${submitResult.totalCount ?? 0})` : ""}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {runResult?.time && <span>Time: {runResult.time}s</span>}
                  {submitResult?.status && (
                    <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                      submitResult.status === "accepted" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {submitResult.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Console Drawer Body */}
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-200 space-y-2">
                {activeConsoleTab === "terminal" && (
                  <>
                    {!runResult && !submitResult && !isRunningCode && (
                      <p className="text-slate-500 text-[11px] italic">
                        Click &apos;Run Code&apos; to execute against sample tests, or &apos;Submit Solution&apos; to run full evaluation.
                      </p>
                    )}

                    {runResult?.stdout && (
                      <div>
                        <span className="text-emerald-400 font-semibold block text-[11px]">Standard Output:</span>
                        <pre className="whitespace-pre-wrap mt-0.5 text-slate-100 bg-slate-900/60 p-2 rounded border border-slate-800">{runResult.stdout}</pre>
                      </div>
                    )}

                    {runResult?.compileOutput && (
                      <div>
                        <span className="text-red-400 font-semibold block text-[11px]">Compiler Message:</span>
                        <pre className="whitespace-pre-wrap mt-0.5 text-red-300 bg-red-950/30 p-2 rounded border border-red-500/30">{runResult.compileOutput}</pre>
                      </div>
                    )}

                    {runResult?.error && (
                      <div className="text-red-400 p-2 rounded bg-red-950/20 border border-red-500/30">
                        {runResult.error}
                      </div>
                    )}
                  </>
                )}

                {activeConsoleTab === "tests" && (
                  <div className="space-y-2">
                    {submitResult?.results ? (
                      submitResult.results.map((r: any, idx: number) => (
                        <div key={idx} className={`p-2 rounded border text-[11px] space-y-1 ${
                          r.passed ? "bg-emerald-950/20 border-emerald-500/30" : "bg-red-950/20 border-red-500/30"
                        }`}>
                          <div className="flex items-center justify-between font-semibold">
                            <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                              Test Case {idx + 1}: {r.passed ? "PASSED" : "FAILED"}
                            </span>
                          </div>
                          <div><span className="text-slate-400">Input:</span> {r.input}</div>
                          <div><span className="text-slate-400">Expected:</span> {r.expected}</div>
                          <div><span className="text-slate-400">Actual:</span> {r.actual}</div>
                        </div>
                      ))
                    ) : codingProblem?.visibleTestCases ? (
                      codingProblem.visibleTestCases.map((tc: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                          <span className="text-slate-400 font-semibold">Sample Test Case {idx + 1}:</span>
                          <div><span className="text-blue-400">Input:</span> {tc.input}</div>
                          <div><span className="text-emerald-400">Expected:</span> {tc.expectedOutput}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-[11px]">No test case results yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Single-Column Conversational Interview Stage (Rounds 1, 2, 4) */
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          {/* Active Question Spotlight Card */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 via-[#0e1424] to-[#0c101a] p-5 sm:p-6 shadow-xl shadow-blue-950/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Round {session?.currentRound}: {ROUND_NAMES[session?.currentRound || 1]}
                </span>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-500/25">
                  Question {(session?.currentQuestionIndex || 0) + 1}
                </span>

                {/* Interviewer State Live Badge */}
                {voiceState === "interviewer_speaking" ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold animate-pulse">
                    <span className="flex items-center gap-0.5 h-2.5">
                      <span className="w-0.5 bg-blue-400 rounded-full wave-bar-1" />
                      <span className="w-0.5 bg-blue-400 rounded-full wave-bar-2" />
                      <span className="w-0.5 bg-blue-400 rounded-full wave-bar-3" />
                    </span>
                    <span>Interviewer Speaking...</span>
                  </span>
                ) : voiceState === "ready_to_listen" || voiceState === "user_speaking" ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-[11px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Listening for Answer</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>Awaiting Input</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const lastQ = [...messages].reverse().find(m => m.sender === "interviewer" && (m.messageType === "question" || m.messageType === "clarification"));
                    if (lastQ) voiceControllerRef.current?.replayCurrentQuestion(lastQ.content);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 hover:bg-muted px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  title="Listen to interviewer speak this question aloud"
                >
                  <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Replay Audio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    voiceControllerRef.current?.interruptInterviewer();
                    setIsClarifyOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  title="Ask interviewer for hints, constraints, or clarifications"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ask / Clarify</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-foreground leading-relaxed whitespace-pre-wrap py-1">
              {(() => {
                const qMsg = [...messages].reverse().find(m => m.sender === "interviewer" && m.messageType === "question");
                return qMsg?.content || "Waiting for question from the interviewer...";
              })()}
            </div>

            {/* Active Clarification Callout */}
            {(() => {
              const clarifyMsg = [...messages].reverse().find(m => m.sender === "interviewer" && m.messageType === "clarification");
              if (!clarifyMsg) return null;
              return (
                <div className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 to-transparent p-3.5 text-xs text-amber-200 space-y-1 mt-2">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Interviewer Clarification / Guidance:
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">{clarifyMsg.content}</div>
                </div>
              );
            })()}

            {/* Feedback / Evaluation Callout */}
            {(() => {
              const feedbackMsg = [...messages].reverse().find(m => m.sender === "interviewer" && m.messageType === "feedback");
              if (!feedbackMsg) return null;
              return (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 sm:p-4 text-xs text-indigo-200 space-y-1.5 animate-in fade-in">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Interviewer Assessment & Coaching:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-foreground/90">{feedbackMsg.content}</p>
                </div>
              );
            })()}
          </div>

          {/* Voice Controls & Candidate Answer Input Card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Voice Status & Controls Bar */}
            <div className="p-3 sm:p-4 border-b border-border bg-muted/20">
              {voiceControllerRef.current && (
                <VoiceControls
                  voiceState={voiceState}
                  isVoiceMode={isVoiceMode}
                  onToggleVoiceMode={() => {
                    const next = !isVoiceMode;
                    setIsVoiceMode(next);
                    voiceControllerRef.current?.setVoiceMode(next);
                    if (next) {
                      handleStartListening();
                    } else {
                      handleStopListening();
                    }
                  }}
                  onStartListening={handleStartListening}
                  onStopListening={handleStopListening}
                  onDoneSpeaking={handleDoneSpeaking}
                  silenceCountdown={silenceCountdown}
                  onCancelSilenceCountdown={handleCancelSilenceCountdown}
                  onStopSpeaking={() => voiceControllerRef.current?.stopSpeaking()}
                  onReplayQuestion={() => {
                    const lastQ = [...messages].reverse().find(m => m.sender === "interviewer");
                    if (lastQ) voiceControllerRef.current?.replayCurrentQuestion(lastQ.content);
                  }}
                  onInterrupt={() => {
                    voiceControllerRef.current?.interruptInterviewer();
                    setIsClarifyOpen(true);
                  }}
                  onStartWhisperRecording={handleStartWhisperRecording}
                  onStopWhisperRecording={handleStopWhisperRecording}
                  isWhisperRecording={isWhisperRecording}
                  isTranscribingAudio={isTranscribingAudio}
                  synthesizer={voiceControllerRef.current.getSpeechSynthesizer()}
                  errorMessage={voiceError}
                />
              )}
            </div>

            {/* Input Form Panel */}
            <div className="p-3 sm:p-4">
              <LiveTranscriptPanel
                voiceState={voiceState}
                interimTranscript={interimTranscript}
                finalTranscript={finalTranscript}
                onSubmit={handleSubmitAnswer}
                onDoneSpeaking={handleDoneSpeaking}
                silenceCountdown={silenceCountdown}
                onCancelSilenceCountdown={handleCancelSilenceCountdown}
                submitting={submitting}
                manualText={manualText}
                setManualText={setManualText}
                errorMessage={error}
                onCancelSubmission={handleCancelSubmission}
                isTranscribingAudio={isTranscribingAudio}
              />
            </div>
          </div>

          {/* Interview Conversation & Turn History (Collapsible, spacious scroll) */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/50 text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span>Conversation History & Discussion Log ({messages.length} messages)</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{showHistory ? "Hide Log ▲" : "Show Log ▼"}</span>
            </button>

            {showHistory && (
              <div className="max-h-[380px] overflow-y-auto p-4 space-y-4 border-t border-border">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[88%] ${
                      msg.sender === "candidate" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                        msg.sender === "candidate"
                          ? "bg-blue-600 text-white"
                          : msg.sender === "system"
                          ? "bg-amber-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                      }`}
                    >
                      {msg.sender === "candidate" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={`rounded-xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.sender === "candidate"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : msg.sender === "system"
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-tl-none"
                          : "bg-muted/70 border border-border text-foreground rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-medium">
                        <span>
                          {msg.sender === "candidate"
                            ? "Candidate (You)"
                            : msg.sender === "system"
                            ? "System Notice"
                            : "AI Interviewer"}
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      )}

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
    </ErrorBoundary>
  );
}
