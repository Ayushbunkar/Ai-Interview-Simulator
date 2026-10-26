"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Square,
  AlertCircle,
  HelpCircle,
  Settings,
  Flame,
  Sparkles,
} from "lucide-react";
import { VoiceState } from "@/lib/types";
import { BrowserSpeechSynthesizer } from "@/lib/voice/speech-synthesis";

interface VoiceControlsProps {
  voiceState: VoiceState;
  isVoiceMode: boolean;
  onToggleVoiceMode: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onReplayQuestion: () => void;
  onInterrupt: () => void;
  onStartWhisperRecording?: () => void;
  onStopWhisperRecording?: () => void;
  isWhisperRecording?: boolean;
  isTranscribingAudio?: boolean;
  synthesizer: BrowserSpeechSynthesizer;
  errorMessage: string | null;
}

export function VoiceControls({
  voiceState,
  isVoiceMode,
  onToggleVoiceMode,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onReplayQuestion,
  onInterrupt,
  onStartWhisperRecording,
  onStopWhisperRecording,
  isWhisperRecording = false,
  isTranscribingAudio = false,
  synthesizer,
  errorMessage,
}: VoiceControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Timer while recording audio with Whisper
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isWhisperRecording) {
      setRecordSeconds(0);
      timer = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isWhisperRecording]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        const englishVoices = vList.filter(v => v.lang.startsWith("en"));
        const list = englishVoices.length > 0 ? englishVoices : vList;
        setVoices(list);

        try {
          const savedVoice = localStorage.getItem("interviewforge_voice_uri") || synthesizer.getSelectedVoiceURI();
          if (savedVoice) {
            setSelectedVoice(savedVoice);
            synthesizer.setVoice(savedVoice);
          } else if (list.length > 0 && !selectedVoice) {
            const pref = list.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("David") || v.name.includes("Ravi")) || list[0];
            if (pref) {
              const val = pref.voiceURI || pref.name;
              setSelectedVoice(val);
              synthesizer.setVoice(val);
            }
          }
        } catch {}
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    try {
      const savedRate = localStorage.getItem("interviewforge_voice_rate");
      if (savedRate) {
        const r = parseFloat(savedRate);
        if (!isNaN(r)) {
          setSpeechRate(r);
          synthesizer.setRate(r);
        }
      }
    } catch {}
  }, [synthesizer]);

  const handleVoiceChange = (uri: string) => {
    setSelectedVoice(uri);
    synthesizer.setVoice(uri);
    try {
      localStorage.setItem("interviewforge_voice_uri", uri);
    } catch {}

    if (voiceState === "interviewer_speaking" && synthesizer.getCurrentText()) {
      synthesizer.speak(synthesizer.getCurrentText(), synthesizer.getCurrentUtteranceId() || "curr-" + Date.now(), {
        onEnd: () => {
          onStopSpeaking();
        },
      });
    } else {
      synthesizer.speak("Interviewer voice updated.", "sample-" + Date.now());
    }
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    synthesizer.setRate(rate);
    try {
      localStorage.setItem("interviewforge_voice_rate", String(rate));
    } catch {}

    if (voiceState === "interviewer_speaking" && synthesizer.getCurrentText()) {
      synthesizer.speak(synthesizer.getCurrentText(), synthesizer.getCurrentUtteranceId() || "curr-" + Date.now(), {
        onEnd: () => {
          onStopSpeaking();
        },
      });
    }
  };

  const isInterviewerSpeaking = voiceState === "interviewer_speaking";
  const isListening = voiceState === "ready_to_listen" || voiceState === "user_speaking";

  return (
    <div className="space-y-3">
      {/* Top Header & Toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            {isInterviewerSpeaking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </>
            ) : isListening ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            {voiceState === "interviewer_speaking" && (
              <span className="text-blue-400 font-bold">Interviewer Speaking...</span>
            )}
            {voiceState === "ready_to_listen" && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span>Listening for your answer... Speak naturally</span>
              </span>
            )}
            {voiceState === "user_speaking" && (
              <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                <span>Transcribing your speech in real-time...</span>
              </span>
            )}
            {voiceState === "processing_answer" && "Evaluating your response..."}
            {voiceState === "interviewer_thinking" && "Interviewer thinking..."}
            {voiceState === "idle" && (isVoiceMode ? "Voice Ready (Mic Paused)" : "Text-Only Mode")}
            {voiceState === "error" && "Voice Error"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            title="Speech Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Voice Mode Toggle */}
          <button
            type="button"
            onClick={onToggleVoiceMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isVoiceMode
                ? "bg-blue-600/10 text-blue-500 border border-blue-500/30 font-semibold"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            {isVoiceMode ? <Volume2 className="h-3.5 w-3.5 text-blue-500" /> : <VolumeX className="h-3.5 w-3.5" />}
            {isVoiceMode ? "Voice ON" : "Voice OFF"}
          </button>
        </div>
      </div>

      {/* Primary Voice Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Whisper Audio Recording State */}
        {isWhisperRecording ? (
          <button
            type="button"
            onClick={onStopWhisperRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-all animate-pulse cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-white" />
            <span>Recording ({recordSeconds}s) — Click to Transcribe to Answer</span>
          </button>
        ) : isTranscribingAudio ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-medium animate-pulse">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span>Transcribing with Whisper AI into answer input...</span>
          </div>
        ) : isListening ? (
          <button
            type="button"
            onClick={onStopListening}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer ring-2 ring-emerald-400/40"
            title="Microphone is actively transcribing your voice directly into the answer box. Click to pause."
          >
            <span className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 bg-white rounded-full wave-bar-1 animate-pulse" />
              <span className="w-0.5 bg-white rounded-full wave-bar-2 animate-pulse" />
              <span className="w-0.5 bg-white rounded-full wave-bar-3 animate-pulse" />
              <span className="w-0.5 bg-white rounded-full wave-bar-4 animate-pulse" />
              <span className="w-0.5 bg-white rounded-full wave-bar-5 animate-pulse" />
            </span>
            <Mic className="h-4 w-4" />
            <span>Listening Live (Click to Pause)</span>
          </button>
        ) : (
          <>
            {/* Primary Live Microphone Action */}
            <button
              type="button"
              onClick={onStartListening}
              disabled={!isVoiceMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              title="Speak naturally through your microphone and auto-transcribe directly into the answer box"
            >
              <Mic className="h-4 w-4" />
              <span>Start Speaking (Auto-Transcribe)</span>
            </button>

            {/* Whisper AI Audio Recording Mode */}
            {onStartWhisperRecording && (
              <button
                type="button"
                onClick={onStartWhisperRecording}
                disabled={!isVoiceMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                title="Records audio clip and transcribes via Whisper AI"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Whisper AI Mode</span>
              </button>
            )}
          </>
        )}

        {/* Interrupt Button: Stop interviewer speaking and ask question */}
        {isInterviewerSpeaking && (
          <button
            type="button"
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all animate-pulse cursor-pointer"
            title="Interrupt interviewer and ask a clarification or question"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Interrupt Interviewer</span>
          </button>
        )}

        {/* Stop Speaking */}
        {isInterviewerSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Square className="h-3.5 w-3.5" />
            <span>Stop Audio</span>
          </button>
        )}

        {/* Replay Question */}
        <button
          type="button"
          onClick={onReplayQuestion}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Replay the last question aloud"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Replay Question</span>
        </button>

        {/* Quick Interruption Help Button */}
        <button
          type="button"
          onClick={onInterrupt}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-all ml-auto cursor-pointer"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Ask / Clarify</span>
        </button>
      </div>

      {/* Voice & Speech Settings Drawer */}
      {showSettings && (
        <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Interviewer Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground"
            >
              {voices.map((v) => (
                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Speech Rate: {speechRate}x</label>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
