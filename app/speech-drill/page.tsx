"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { getRoadmapQuestionById, findRoadmapQuestionByText } from "@/lib/data/interviewReadyRoadmap";
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

function SpeechDrillContent() {
  const searchParams = useSearchParams();
  const qIdParam = searchParams.get("qId");
  const qTextParam = searchParams.get("qText");

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

  // Initialize Speech Services & Load Question (from URL params or random)
  useEffect(() => {
    synthesizerRef.current = new BrowserSpeechSynthesizer();

    let targetQuestion: QuestionBankItem | null = null;

    // 1. Check if qIdParam matches in ALL_QUESTIONS (700 bank)
    if (qIdParam) {
      const bankMatch = ALL_QUESTIONS.find(q => q.id === qIdParam);
      if (bankMatch) {
        targetQuestion = bankMatch;
      } else {
        // Check in 34-day Interview Ready Roadmap
        const rmqMatch = getRoadmapQuestionById(qIdParam);
        if (rmqMatch) {
          targetQuestion = {
            id: rmqMatch.question.id,
            catId: rmqMatch.day.phaseId,
            category: rmqMatch.day.phaseName,
            num: rmqMatch.question.qNum,
            question: rmqMatch.question.question,
            modelAnswer: rmqMatch.question.answer,
            keyPoints: [
              rmqMatch.question.question,
              ...(rmqMatch.question.answer.split(/\.\s+/).filter(s => s.trim().length > 15).slice(0, 3)),
            ],
            difficulty: "Core",
            sampleSpokenStart: `To answer directly: ${rmqMatch.question.question.replace(/\?$/, "")}...`,
            ...( { source: `Day ${rmqMatch.day.dayNumber} • ${rmqMatch.day.phaseName}` } as any )
          };
        }
      }
    }

    // 2. Check localStorage for cached question from clicking mic in roadmap
    if (!targetQuestion && typeof window !== "undefined") {
      try {
        const cachedStr = localStorage.getItem("interviewforge_active_drill_question");
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached && cached.question && (!qIdParam || cached.id === qIdParam)) {
            targetQuestion = cached;
          }
        }
      } catch (e) {
        console.warn("Storage parse error:", e);
      }
    }

    // 3. Fallback to question text match if provided
    if (!targetQuestion && qTextParam) {
      const textMatch = findRoadmapQuestionByText(qTextParam);
      if (textMatch) {
        targetQuestion = {
          id: textMatch.question.id,
          catId: textMatch.day.phaseId,
          category: textMatch.day.phaseName,
          num: textMatch.question.qNum,
          question: textMatch.question.question,
          modelAnswer: textMatch.question.answer,
          keyPoints: [
            textMatch.question.question,
            ...(textMatch.question.answer.split(/\.\s+/).filter(s => s.trim().length > 15).slice(0, 3)),
          ],
          difficulty: "Core",
          sampleSpokenStart: `To answer directly: ${textMatch.question.question.replace(/\?$/, "")}...`,
          ...( { source: `Day ${textMatch.day.dayNumber} • ${textMatch.day.phaseName}` } as any )
        };
      }
    }

    const qToLoad = targetQuestion || getRandomQuestion("all");
    setCurrentQuestion(qToLoad);
    if (targetQuestion && targetQuestion.catId) {
      setSelectedCatId(targetQuestion.catId);
    }
    setQuestionHistory([qToLoad.id]);
    setHistoryIndex(0);
    setTranscript("");
    setEvaluation(null);
    setIsEvaluating(false);
    setPracticeMode("initial");
    setShowModelAnswer(false);

    return () => {
      if (synthesizerRef.current) synthesizerRef.current.stop();
      if (recognizerRef.current) recognizerRef.current.stop();
      if (audioRecorderRef.current) audioRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qIdParam, qTextParam]);

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

    // Check if live speech recognition already captured a full English response (> 15 chars and no Devanagari)
    const currentLiveText = (liveFinalTranscriptRef.current || transcript).trim();
    const hasDevanagari = /[\u0900-\u097F]/.test(currentLiveText);

    if (!hasDevanagari && currentLiveText.length >= 15) {
      setTranscript(currentLiveText);
      // Clean up audio recorder without waiting for network transcribe
      if (audioRecorderRef.current && audioRecorderRef.current.isRecording()) {
        try { await audioRecorderRef.current.stop(); } catch {}
      }
      return;
    }

    // If live text is empty, short, or contained Hindi Devanagari, automatically transcribe with Groq Whisper Cloud STT in English!
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 transition-colors">
      {/* Top Banner Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md sticky top-14 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Fresher SDE Speech Drill Room
                </h1>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {ALL_QUESTIONS.length} Questions Bank (15 Subjects)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Select any topic • Speak your answer • Get instant articulation & English fluency feedback • Learn the real answer
              </p>
            </div>
          </div>

          {/* Topic Selector Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTopicModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
            >
              <CurrentIcon className="h-4 w-4 text-blue-500" />
              <span>
                {selectedCatId === "all" ? `All 15 Subjects (${ALL_QUESTIONS.length} Qs)` : activeCategoryMeta?.name || "Topic"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>

            {/* Next Question Explicit Button */}
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold shadow-sm transition-all active:scale-95"
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
            {/* If navigated from roadmap, show return trail */}
            {((currentQuestion as any).source || qIdParam) && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <Link
                  href="/interview-ready"
                  className="text-xs text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1.5 font-semibold group"
                >
                  <ArrowRight className="h-3.5 w-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Return to Interview Ready Roadmap</span>
                </Link>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Target Question Loaded
                </span>
              </div>
            )}

            {/* Question Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-colors">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                    <CurrentIcon className="h-3 w-3" />
                    {currentQuestion.category}
                  </span>
                  {(currentQuestion as any).source ? (
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {(currentQuestion as any).source}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      Q{currentQuestion.num} of 50
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleQuestionAudio}
                    title="Listen to question"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                      isPlayingTTS
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 animate-pulse"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {isPlayingTTS ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    <span>{isPlayingTTS ? "Stop Audio" : "Listen"}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-relaxed tracking-tight">
                {currentQuestion.question}
              </h2>

              {/* Starter Helper */}
              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tip: Speak naturally for 20-45 seconds. Question stays until you click <strong>Next Question</strong>.</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            {/* Voice Answer Recording Station */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {practiceMode === "re-speak" ? "Re-Speak Practice Mode" : "Voice Answer Input"}
                  </span>
                  {practiceMode === "re-speak" && (
                    <span className="rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                      Repeating Real Answer
                    </span>
                  )}
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                    <Zap className="h-3 w-3 text-amber-500" />
                    AssemblyAI + Speechmatics + Gladia + Sarvam + Whisper
                  </span>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>00:{recordingSeconds.toString().padStart(2, "0")}</span>
                  </div>
                )}
              </div>

              {/* Error Alert Banner */}
              {voiceError && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{voiceError}</span>
                  </div>
                  <button onClick={() => setVoiceError(null)} className="text-zinc-400 hover:text-zinc-600 px-2 py-0.5 rounded text-xs">
                    ✕
                  </button>
                </div>
              )}

              {/* Transcribing Indicator Banner */}
              {isTranscribing && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold">Transcribing your speech with AI Cloud STT (AssemblyAI / Speechmatics / Gladia / Sarvam / Whisper)... Please wait.</span>
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
                      ? "🎙️ Listening... Speak your answer now. Words will transcribe in real-time, with automatic AssemblyAI, Speechmatics, Gladia, Sarvam & Whisper backup when you stop."
                      : isTranscribing
                      ? "⚡ Transcribing speech with AI (AssemblyAI / Speechmatics / Gladia / Sarvam / Whisper)..."
                      : "Click 'Start Speaking Answer' to record your response. Your spoken words will transcribe and be evaluated here automatically."
                  }
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all font-sans leading-relaxed resize-none"
                />

                {isRecording && (
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 text-[11px] font-mono bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-semibold">Recording Mic</span>
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
                    >
                      <Mic className="h-4 w-4" />
                      <span>{transcript ? "Speak More / Resume" : "Start Speaking Answer"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all border border-red-500"
                    >
                      <MicOff className="h-4 w-4 text-red-400" />
                      <span>Stop Recording & Transcribe</span>
                    </button>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                      <span>Cloud STT Transcribing...</span>
                    </div>
                  )}

                  {transcript && !isRecording && (
                    <button
                      onClick={() => setTranscript("")}
                      title="Clear answer"
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!transcript.trim() || isEvaluating}
                    onClick={handleEvaluateAnswer}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-current" />
                        <span>Evaluating Speech...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Evaluate Articulation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Official Model Answer Section */}
            {(showModelAnswer || evaluation) && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Official Model Answer & Talking Points
                    </h3>
                  </div>

                  {/* Re-Speak Button */}
                  <button
                    onClick={handleStartModelAnswerPractice}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>Practice Speaking Real Answer</span>
                  </button>
                </div>

                {/* Model Answer Body */}
                <div className="space-y-3 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p>{currentQuestion.modelAnswer}</p>
                </div>

                {/* Key Talking Points */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Essential Technical Concepts
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.keyPoints.map((kp, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-zinc-700 dark:text-zinc-300">{kp}</span>
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
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-5 sm:p-6 shadow-sm space-y-5 transition-colors">
                {/* Score Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Spoken Articulation Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                        {evaluation.overallScore}
                      </span>
                      <span className="text-sm font-semibold text-zinc-400">/ 100</span>
                      {evaluation.scoreDelta !== undefined && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                            evaluation.scoreDelta >= 0
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
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
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                        evaluation.overallScore < 40 || evaluation.isFactuallyIncorrect
                          ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                          : evaluation.overallScore < 60
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : evaluation.overallScore < 75
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : evaluation.overallScore < 85
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {evaluation.verdict || (evaluation.overallScore >= 85 ? "Interview Ready" : evaluation.overallScore >= 70 ? "Competent" : "Needs Major Work")}
                    </span>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                      {evaluation.wordsPerMinute} WPM
                    </div>
                  </div>
                </div>

                {/* Critical Technical Inaccuracy Warning Banner */}
                {(evaluation.isFactuallyIncorrect || (evaluation.factualErrors && evaluation.factualErrors.length > 0)) && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-3.5 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
                      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
                      <span>Critical Technical Inaccuracy / Concept Confusion</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed font-sans">
                      In fresher and SDE technical interviews, factual mistakes (such as confusing fundamental concepts) result in an immediate low score regardless of speaking speed.
                    </p>
                    {evaluation.factualErrors && evaluation.factualErrors.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-red-200 dark:border-red-900/40 mt-1.5">
                        {evaluation.factualErrors.map((err, i) => (
                          <div key={i} className="text-xs text-red-700 dark:text-red-300 font-medium flex items-start gap-1.5">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Score Bars - Strict Technical Interview Weighting */}
                <div className="space-y-3.5 text-xs">
                  {/* Primary Bar: Technical Accuracy (50% Weight) */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center text-zinc-800 dark:text-zinc-200 mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                        Answer Correctness & Technical Accuracy (50% Weight)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evaluation.contentAccuracyScore >= 70
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : evaluation.contentAccuracyScore >= 40
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                        }`}>
                          {evaluation.contentAccuracyScore >= 70 ? "Accurate" : evaluation.contentAccuracyScore >= 40 ? "Partial" : "Inaccurate"}
                        </span>
                        <span className="font-mono font-bold">
                          {evaluation.contentAccuracyScore}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          evaluation.contentAccuracyScore >= 70
                            ? "bg-emerald-500"
                            : evaluation.contentAccuracyScore >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(4, evaluation.contentAccuracyScore)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bar 2: English Grammar & Syntax (20% Weight) */}
                  <div>
                    <div className="flex justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>English Grammar & Sentence Syntax (20% Weight)</span>
                      <span className="font-semibold font-mono">{evaluation.grammarScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-800 dark:bg-zinc-200 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, evaluation.grammarScore)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bar 3: Pronunciation & Articulation (15% Weight) */}
                  <div>
                    <div className="flex justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>Pronunciation & Articulation Precision (15% Weight)</span>
                      <span className="font-semibold font-mono">{evaluation.articulationScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, evaluation.articulationScore)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bar 4: Speech Fluency & Rhythm (15% Weight) */}
                  <div>
                    <div className="flex justify-between text-zinc-700 dark:text-zinc-300 mb-1">
                      <span>Speech Fluency & Rhythm (15% Weight)</span>
                      <span className="font-semibold font-mono">{evaluation.fluencyScore}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, evaluation.fluencyScore)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filler Words Metric Box */}
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      Filler Words Analysis
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        evaluation.fillerWordCount === 0
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
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
                          className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-mono"
                        >
                          "{f.word}" ({f.count})
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans">
                      Clean delivery! No filler words like "basically" or "um" were found.
                    </p>
                  )}
                </div>

                {/* Spoken Delivery Coaching */}
                <div className={`rounded-xl p-3.5 space-y-1.5 border ${
                  evaluation.overallScore < 50 || evaluation.isFactuallyIncorrect
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
                    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200"
                }`}>
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                    evaluation.overallScore < 50 || evaluation.isFactuallyIncorrect
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {evaluation.overallScore < 50 || evaluation.isFactuallyIncorrect
                      ? "Technical Interviewer Verdict & Coaching"
                      : "Speech Coaching Guidance"}
                  </span>
                  <p className="text-xs leading-relaxed font-sans">
                    {evaluation.deliveryCoaching}
                  </p>
                </div>

                {/* Key Strengths & Polish Areas */}
                <div className="space-y-3 pt-1">
                  {evaluation.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        What You Articulated Well
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {evaluation.strengths.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.areasToImprove.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Articulation Improvement Pointers
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {evaluation.areasToImprove.map((a, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Next Question CTA */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={handleNextQuestion}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    <span>Done with this question? Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Empty State Card */
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 shadow-sm text-center space-y-4 transition-colors">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                  <Mic className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Speech & Communication Analysis
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    Speak your answer out loud into the microphone. Our speech engine evaluates your articulation, speech pace (WPM), filler words, and technical accuracy.
                  </p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Pacing Check
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Measures speaking tempo against 120-150 WPM pocket.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Filler Detection
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Flags "um", "basically", "like" so you sound confident.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* TOPIC SELECTION MODAL DRAWER */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Choose a Subject Category (14 Topics • 50 Questions Each)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select a specific topic to drill random questions from that domain, or choose All Subjects.
                </p>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
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
                    ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-sm"
                    : "bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    All 15 Subjects
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {ALL_QUESTIONS.length} Qs
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm ring-1 ring-blue-500"
                        : "bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        50 Qs
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
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

export default function SpeechDrillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Loading Speech Drill Station...</span>
        </div>
      }
    >
      <SpeechDrillContent />
    </Suspense>
  );
}
