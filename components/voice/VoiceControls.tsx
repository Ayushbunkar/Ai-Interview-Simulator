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
  synthesizer,
  errorMessage,
}: VoiceControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const vList = window.speechSynthesis.getVoices();
        const englishVoices = vList.filter(v => v.lang.startsWith("en"));
        setVoices(englishVoices.length > 0 ? englishVoices : vList);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceChange = (uri: string) => {
    setSelectedVoice(uri);
    synthesizer.setVoice(uri);
  };

  const handleRateChange = (rate: number) => {
    setSpeechRate(rate);
    synthesizer.setRate(rate);
  };

  const isInterviewerSpeaking = voiceState === "interviewer_speaking";
  const isListening = voiceState === "ready_to_listen" || voiceState === "user_speaking";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
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
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {voiceState === "interviewer_speaking" && "Interviewer Speaking..."}
            {voiceState === "ready_to_listen" && "Listening for your answer..."}
            {voiceState === "user_speaking" && "Transcribing your voice..."}
            {voiceState === "processing_answer" && "Evaluating your response..."}
            {voiceState === "interviewer_thinking" && "Interviewer thinking..."}
            {voiceState === "idle" && (isVoiceMode ? "Voice Ready" : "Text-Only Mode")}
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
                ? "bg-blue-600/10 text-blue-500 border border-blue-500/30"
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
        {/* Mic Listen Toggle */}
        {isListening ? (
          <button
            type="button"
            onClick={onStopListening}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-all animate-pulse"
          >
            <Mic className="h-4 w-4" />
            Listening... (Click to Pause)
          </button>
        ) : (
          <button
            type="button"
            onClick={onStartListening}
            disabled={!isVoiceMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <Mic className="h-4 w-4" />
            Speak Answer (Mic)
          </button>
        )}

        {/* Interrupt Button: Stop interviewer speaking and ask question */}
        {isInterviewerSpeaking && (
          <button
            type="button"
            onClick={onInterrupt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-sm transition-all"
            title="Interrupt interviewer and ask a clarification or question"
          >
            <Flame className="h-3.5 w-3.5" />
            Interrupt Interviewer
          </button>
        )}

        {/* Stop Speaking */}
        {isInterviewerSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-muted-foreground transition-all"
          >
            <Square className="h-3.5 w-3.5" />
            Stop Audio
          </button>
        )}

        {/* Replay Question */}
        <button
          type="button"
          onClick={onReplayQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-muted-foreground transition-all"
          title="Replay the last question aloud"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Replay Question
        </button>

        {/* Quick Interruption Help Button */}
        <button
          type="button"
          onClick={onInterrupt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-medium transition-all ml-auto"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Ask / Clarify
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
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="">Default Browser Voice</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground mb-1 font-medium">
              Speech Speed: <span className="text-foreground font-semibold">{speechRate}x</span>
            </label>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}

      {/* Error / Permission Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
