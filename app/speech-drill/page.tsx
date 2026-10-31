"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Coffee,
  Database,
  Terminal,
  Cpu,
  Network,
  Globe,
  ShieldAlert,
  GitBranch,
  TerminalSquare,
  Boxes,
  Layers,
  FolderGit2,
  UserCheck,
  BrainCircuit,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Flame,
  Bookmark,
} from "lucide-react";
import {
  CATEGORIES,
  CategoryMeta,
  QuestionBankItem,
  getRandomQuestion,
  getQuestionsByCategory,
  ALL_QUESTIONS,
} from "@/lib/data/questionBank700";
import { SpeechEvaluationResult } from "@/lib/assessment/speech-articulation-evaluator";
import { BrowserSpeechSynthesizer } from "@/lib/voice/speech-synthesis";
import { BrowserSpeechRecognizer } from "@/lib/voice/speech-recognition";
import { MediaAudioRecorder } from "@/lib/voice/media-audio-recorder";

const ICON_MAP: Record<string, any> = {
  Coffee,
  Database,
  Terminal,
  Cpu,
  Network,
  Globe,
  ShieldAlert,
  GitBranch,
  CheckCircle2,
  TerminalSquare,
  Boxes,
  Layers,
  FolderGit2,
  UserCheck,
  BrainCircuit,
};

export default function SpeechDrillPage() {
  // Topic and Question State
  const [selectedCatId, setSelectedCatId] = useState<number | "all">("all");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionBankItem>(ALL_QUESTIONS[0]);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Spoken Answer State
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResult | null>(null);

  // Re-speak & Model Answer Practice
  const [practiceMode, setPracticeMode] = useState<"initial" | "re-speak">("initial");
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);

  // Audio TTS State
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const synthesizerRef = useRef<BrowserSpeechSynthesizer | null>(null);
  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);
  const audioRecorderRef = useRef<MediaAudioRecorder | null>(null);
  const liveFinalTranscriptRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Whisper Cloud STT & Audio Fallback State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isAudioDetected, setIsAudioDetected] = useState<boolean>(false);

  // Topic selector drawer / modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState<boolean>(false);

  // Initialize Speech Services on mount
  useEffect(() => {
    synthesizerRef.current = new BrowserSpeechSynthesizer();
    const initialQ = getRandomQuestion("all");
    setCurrentQuestion(initialQ);
    setQuestionHistory([initialQ.id]);
    setHistoryIndex(0);

    return () => {
      if (synthesizerRef.current) synthesizerRef.current.stop();
      if (recognizerRef.current) recognizerRef.current.stop();
      if (audioRecorderRef.current) audioRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Handle Question Change (Explicitly Triggered)
  const handleNextQuestion = () => {
    if (synthesizerRef.current) synthesizerRef.current.stop();
    setIsPlayingTTS(false);
    if (isRecording) handleStopRecording();

    const nextQ = getRandomQuestion(selectedCatId, currentQuestion.id);
    setCurrentQuestion(nextQ);
    setQuestionHistory(prev => [...prev, nextQ.id]);
    setHistoryIndex(prev => prev + 1);

    // Reset interaction state for new question
    setTranscript("");
    setEvaluation(null);
    setPreviousScore(undefined);
    setPracticeMode("initial");
    setShowModelAnswer(false);
    setRecordingSeconds(0);
  };

  const handleSelectCategory = (catId: number | "all") => {
    setSelectedCatId(catId);
    setIsTopicModalOpen(false);
    if (synthesizerRef.current) synthesizerRef.current.stop();
    setIsPlayingTTS(false);

    const nextQ = getRandomQuestion(catId);
    setCurrentQuestion(nextQ);
    setQuestionHistory([nextQ.id]);
    setHistoryIndex(0);
    setTranscript("");
    setEvaluation(null);
    setPreviousScore(undefined);
    setPracticeMode("initial");
    setShowModelAnswer(false);
  };

  // Play Question TTS
  const handleToggleQuestionAudio = () => {
    if (!synthesizerRef.current) return;
    if (isPlayingTTS) {
      synthesizerRef.current.stop();
      setIsPlayingTTS(false);
    } else {
      setIsPlayingTTS(true);
      synthesizerRef.current.speak(currentQuestion.question, "speech-drill-q", {
        onEnd: () => setIsPlayingTTS(false),
        onError: () => setIsPlayingTTS(false),
      });
    }
  };

  // Start Voice Answer Recording (Dual-Engine: Live Browser STT + Whisper AI Audio Backup)
  const handleStartRecording = async (mode: "initial" | "re-speak" = "initial") => {
    if (synthesizerRef.current) synthesizerRef.current.stop();
    setIsPlayingTTS(false);
    setVoiceError(null);

    setPracticeMode(mode);
    setTranscript("");
    liveFinalTranscriptRef.current = "";
    setIsRecording(true);
    setIsAudioDetected(false);

    // 1. Initialize & Start MediaAudioRecorder (Local microphone capture for 100% reliable Whisper STT)
    audioRecorderRef.current = new MediaAudioRecorder({
      onRecordingStart: () => {
        setIsAudioDetected(true);
      },
      onError: (err) => {
        console.warn("Audio recorder warning:", err);
        setVoiceError(err);
      },
    });

    try {
      const audioStarted = await audioRecorderRef.current.start();
      if (audioStarted) {
        setIsAudioDetected(true);
      }
    } catch (e: any) {
      console.warn("Audio recorder start error:", e);
      setVoiceError(e.message || "Microphone access could not be initialized.");
    }

    // 2. Initialize & Start BrowserSpeechRecognizer for real-time live streaming text
    try {
      let accumulatedFinal = "";
      recognizerRef.current = new BrowserSpeechRecognizer({
        continuous: true,
        interimResults: true,
        lang: "en-US",
        onInterimTranscript: (interim) => {
          setIsAudioDetected(true);
          const full = (accumulatedFinal ? accumulatedFinal + " " : "") + interim;
          setTranscript(full.trim());
        },
        onFinalTranscript: (final) => {
          setIsAudioDetected(true);
          accumulatedFinal = final.trim();
          liveFinalTranscriptRef.current = accumulatedFinal;
          setTranscript(accumulatedFinal);
        },
        onError: (err) => {
          console.warn("Browser live speech warning:", err);
          // If browser speech API encounters a network or unsupported error,
          // MediaAudioRecorder continues recording and Whisper AI will transcribe automatically upon stop!
        },
        onNetworkFallback: () => {
          console.warn("Browser Web Speech network error. Whisper AI will automatically transcribe upon stopping.");
        },
      });

      recognizerRef.current.start();
    } catch (err: any) {
      console.warn("Live speech recognition start error:", err);
    }
  };

  // Stop Recording & Finalize Transcription
  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsAudioDetected(false);

    // Stop live browser recognition
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
    }

    // Check if live speech recognition already captured a full response (> 15 chars)
    const currentLiveText = (liveFinalTranscriptRef.current || transcript).trim();
    if (currentLiveText.length >= 15) {
      setTranscript(currentLiveText);
      // Clean up audio recorder without waiting for network transcribe
      if (audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
        try { await audioRecorderRef.current.stop(); } catch {}
      }
      return;
    }

    // If live text is empty or very short, automatically transcribe with Groq Whisper Cloud STT!
    if (audioRecorderRef.current) {
      setIsTranscribing(true);
      try {
        const whisperText = await audioRecorderRef.current.stopAndTranscribe();
        if (whisperText && whisperText.trim()) {
          setTranscript(whisperText.trim());
          setVoiceError(null);
        } else if (!currentLiveText) {
          setVoiceError("No speech detected. Please ensure your microphone is unmuted, speak clearly, and click 'Stop Recording'.");
        }
      } catch (err: any) {
        console.error("Whisper transcription error:", err);
        if (!currentLiveText) {
          setVoiceError(err.message || "Failed to transcribe audio. Please check your microphone or type your answer.");
        }
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  // Evaluate Spoken Answer
  const handleEvaluateAnswer = async () => {
    if (!transcript.trim()) return;

    if (isRecording) {
      await handleStopRecording();
    }

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/speech-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          question: currentQuestion.question,
          modelAnswer: currentQuestion.modelAnswer,
          keyPoints: currentQuestion.keyPoints,
          audioDurationSeconds: Math.max(5, recordingSeconds),
          mode: practiceMode,
          previousScore: practiceMode === "re-speak" && evaluation ? evaluation.overallScore : undefined,
        }),
      });

      if (!res.ok) throw new Error("Evaluation request failed");
      const data = await res.json();
      
      if (data.evaluation) {
        if (practiceMode === "initial") {
          setPreviousScore(data.evaluation.overallScore);
        }
        setEvaluation(data.evaluation);
        setShowModelAnswer(true); // Automatically reveal model answer so user can learn and re-speak!
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Prepare Re-speak of Model Answer
  const handleStartModelAnswerPractice = () => {
    if (evaluation) {
      setPreviousScore(evaluation.overallScore);
    }
    setPracticeMode("re-speak");
    setTranscript("");
    handleStartRecording("re-speak");
  };

  const activeCategoryMeta = CATEGORIES.find(c => c.catId === currentQuestion.catId);
  const CurrentIcon = activeCategoryMeta ? ICON_MAP[activeCategoryMeta.icon] || BookOpen : BookOpen;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 pb-20">
      {/* Top Banner Header */}
      <div className="border-b border-white/[0.08] bg-[#0c1220]/70 backdrop-blur-xl sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Fresher SDE Speech Drill Room
                </h1>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                  {ALL_QUESTIONS.length} Questions Bank (15 Subjects)
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Select any topic • Speak your answer • Get instant articulation & English fluency feedback • Learn the real answer
              </p>
            </div>
          </div>

          {/* Topic Selector Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-slate-200 transition-colors shadow-sm"
            >
              <CurrentIcon className="h-4 w-4 text-cyan-400" />
              <span>
                {selectedCatId === "all" ? `All 15 Subjects (${ALL_QUESTIONS.length} Qs)` : activeCategoryMeta?.name || "Topic"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Next Question Explicit Button */}
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-600/25 transition-all active:scale-95"
            >
              <span>Next Question</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Main Grid: Left = Question & Voice Workspace, Right = Articulation Evaluation & Model Answer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Question & Voice Workspace (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Question Card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${activeCategoryMeta?.gradient || "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                    <CurrentIcon className="h-3 w-3" />
                    {currentQuestion.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Q{currentQuestion.num} of 50
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleQuestionAudio}
                    title="Listen to question"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      isPlayingTTS
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 animate-pulse"
                        : "bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    {isPlayingTTS ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    <span>{isPlayingTTS ? "Stop Audio" : "Listen"}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed tracking-tight">
                {currentQuestion.question}
              </h2>

              {/* Starter Helper */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Tip: Speak naturally for 20-45 seconds. Question stays until you click <strong>Next Question</strong>.</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400 border border-white/[0.06]">
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            {/* Voice Answer Recording Station */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                  <span className="text-sm font-semibold text-white">
                    {practiceMode === "re-speak" ? "Re-Speak Practice Mode" : "Voice Answer Input"}
                  </span>
                  {practiceMode === "re-speak" && (
                    <span className="rounded bg-amber-500/10 text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-500/20">
                      Repeating Real Answer
                    </span>
                  )}
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                    <Zap className="h-3 w-3 text-amber-400" />
                    AssemblyAI Dual Key + Speechmatics + Whisper Backup
                  </span>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>00:{recordingSeconds.toString().padStart(2, "0")}</span>
                  </div>
                )}
              </div>

              {/* Error Alert Banner */}
              {voiceError && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                  <button onClick={() => setVoiceError(null)} className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs">
                    ✕
                  </button>
                </div>
              )}

              {/* Transcribing Indicator Banner */}
              {isTranscribing && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <span className="font-semibold">Transcribing your speech with AssemblyAI / Speechmatics / Whisper Cloud STT... Please wait a moment.</span>
                </div>
              )}

              {/* Transcription Display / Edit Box */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    isRecording
                      ? "🎙️ Listening... Speak your answer now. Words will transcribe in real-time, with automatic AssemblyAI, Speechmatics & Whisper backup when you stop."
                      : isTranscribing
                      ? "⚡ Transcribing speech with AssemblyAI / Speechmatics / Whisper..."
                      : "Click 'Start Speaking Answer' to record your response. Your spoken words will transcribe and be evaluated here automatically."
                  }
                  className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans leading-relaxed resize-none"
                />

                {isRecording && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] font-mono bg-black/90 px-2.5 py-1 rounded-md border border-red-500/30">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-2.5 bg-red-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-2.5 bg-red-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-red-300 font-semibold">Recording Mic</span>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      disabled={isTranscribing}
                      onClick={() => handleStartRecording(practiceMode)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                      <Mic className="h-4 w-4" />
                      <span>{transcript ? "Speak More / Resume" : "Start Speaking Answer"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 hover:bg-slate-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all border border-red-500/40"
                    >
                      <MicOff className="h-4 w-4 text-red-400" />
                      <span>Stop Recording & Transcribe</span>
                    </button>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                      <span>Cloud STT Transcribing...</span>
                    </div>
                  )}

                  {transcript && !isRecording && (
                    <button
                      onClick={() => setTranscript("")}
                      title="Clear answer"
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!transcript.trim() || isEvaluating}
                    onClick={handleEvaluateAnswer}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>Evaluating Speech...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-amber-300" />
                        <span>Evaluate Articulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Official Model Answer Section */}
            {(showModelAnswer || evaluation) && (
              <div className="rounded-2xl border border-blue-500/20 bg-[#0a1020]/90 p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      Official Model Answer & Talking Points
                    </h3>
                  </div>

                  {/* Re-Speak Button */}
                  <button
                    onClick={handleStartModelAnswerPractice}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Practice Speaking Real Answer</span>
                  </button>
                </div>

                {/* Model Answer Body */}
                <div className="space-y-3 text-sm text-slate-300 leading-relaxed font-sans bg-black/30 p-4 rounded-xl border border-white/[0.06]">
                  <p>{currentQuestion.modelAnswer}</p>
                </div>

                {/* Key Talking Points */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Essential Technical Buzzwords & Concepts
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.keyPoints.map((kp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300">{kp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Articulation & Speech Evaluation Report (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {evaluation ? (
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/90 p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
                {/* Score Header */}
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Spoken Articulation Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {evaluation.overallScore}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                      {evaluation.scoreDelta !== undefined && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            evaluation.scoreDelta >= 0
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {evaluation.scoreDelta >= 0 ? `+${evaluation.scoreDelta}` : evaluation.scoreDelta} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                        evaluation.overallScore >= 85
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : evaluation.overallScore >= 70
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {evaluation.overallScore >= 85 ? "Interview Ready" : evaluation.overallScore >= 70 ? "Competent" : "Needs Polish"}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      {evaluation.wordsPerMinute} WPM
                    </div>
                  </div>
                </div>

                {/* Sub-Score Bars */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Pronunciation & Articulation</span>
                      <span className="font-semibold text-cyan-400">{evaluation.articulationScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${evaluation.articulationScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Speech Fluency & Rhythm</span>
                      <span className="font-semibold text-indigo-400">{evaluation.fluencyScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${evaluation.fluencyScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>English Grammar & Tone</span>
                      <span className="font-semibold text-emerald-400">{evaluation.grammarScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${evaluation.grammarScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Technical Concept Coverage</span>
                      <span className="font-semibold text-amber-400">{evaluation.contentAccuracyScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${evaluation.contentAccuracyScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filler Words Metric Box */}
                <div className="rounded-xl bg-black/40 border border-white/[0.06] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      Filler Words Analysis
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        evaluation.fillerWordCount === 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {evaluation.fillerWordCount} detected
                    </span>
                  </div>

                  {evaluation.fillerWordsFound.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {evaluation.fillerWordsFound.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono"
                        >
                          "{f.word}" ({f.count})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-400 font-sans">
                      Clean delivery! No filler words like "basically" or "um" were found.
                    </p>
                  )}
                </div>

                {/* Spoken Delivery Coaching */}
                <div className="rounded-xl bg-blue-950/30 border border-blue-500/20 p-3.5 space-y-1.5">
                  <span className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    Speech Coaching Guidance
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {evaluation.deliveryCoaching}
                  </p>
                </div>

                {/* Key Strengths & Polish Areas */}
                <div className="space-y-3 pt-1">
                  {evaluation.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        What You Articulated Well
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {evaluation.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.areasToImprove.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Articulation Improvement Pointers
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {evaluation.areasToImprove.map((a, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Next Question CTA */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <span>Done with this question? Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Empty State Card */
              <div className="rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-6 shadow-xl text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-md">
                  <Mic className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Speech & Communication Analysis
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Speak your answer out loud into the microphone. Our speech engine evaluates your articulation, speech pace (WPM), filler words, and technical accuracy.
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] space-y-1">
                    <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Pacing Check
                    </span>
                    <p className="text-[10px] text-slate-400">Measures your speaking tempo against the ideal 120-150 WPM pocket.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] space-y-1">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Filler Detection
                    </span>
                    <p className="text-[10px] text-slate-400">Flags "um", "basically", "like" so you sound crisp and confident.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TOPIC SELECTION MODAL DRAWER */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0b101e] border border-white/[0.12] rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Choose a Subject Category (14 Topics • 50 Questions Each)
                </h3>
                <p className="text-xs text-slate-400">
                  Select a specific topic to drill random questions from that domain, or choose All Subjects.
                </p>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Modal Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* All Topics Card */}
              <button
                onClick={() => handleSelectCategory("all")}
                className={`p-4 rounded-xl text-left border transition-all ${
                  selectedCatId === "all"
                    ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border-blue-500/50 shadow-md"
                    : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="h-4 w-4 text-cyan-400" />
                    All 15 Subjects
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {ALL_QUESTIONS.length} Qs
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Complete randomized mix across all core fresher & AI/ML engineering topics.
                </p>
              </button>

              {/* Individual Category Cards */}
              {CATEGORIES.map((cat) => {
                const CatIcon = ICON_MAP[cat.icon] || BookOpen;
                const isSelected = selectedCatId === cat.catId;

                return (
                  <button
                    key={cat.catId}
                    onClick={() => handleSelectCategory(cat.catId)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/60 shadow-md ring-1 ring-blue-500/40"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                        50 Qs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
