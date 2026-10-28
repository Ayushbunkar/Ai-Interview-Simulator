"use client";

import { useState, useEffect } from "react";
import { Send, Edit3, RotateCcw, Sparkles, AlertCircle, XCircle, RefreshCw, Mic } from "lucide-react";
import { VoiceState } from "@/lib/types";

interface LiveTranscriptPanelProps {
  voiceState: VoiceState;
  interimTranscript: string;
  finalTranscript: string;
  onSubmit: (text: string) => void;
  submitting: boolean;
  manualText: string;
  setManualText: (text: string) => void;
  errorMessage?: string | null;
  onCancelSubmission?: () => void;
  isTranscribingAudio?: boolean;
  onDoneSpeaking?: () => void;
  silenceCountdown?: number | null;
  onCancelSilenceCountdown?: () => void;
}

export function LiveTranscriptPanel({
  voiceState,
  interimTranscript,
  finalTranscript,
  onSubmit,
  submitting,
  manualText,
  setManualText,
  errorMessage,
  onCancelSubmission,
  isTranscribingAudio = false,
  onDoneSpeaking,
  silenceCountdown,
  onCancelSilenceCountdown,
}: LiveTranscriptPanelProps) {
  const [editableText, setEditableText] = useState(manualText || "");
  const [elapsedWaitSeconds, setElapsedWaitSeconds] = useState(0);

  // Sync incoming speech recognition transcript
  useEffect(() => {
    if (finalTranscript || interimTranscript) {
      const full = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
      setEditableText(full);
      setManualText(full);
    }
  }, [finalTranscript, interimTranscript, setManualText]);

  // Keep editableText in sync if manualText is updated externally (e.g. Whisper audio or form reset)
  useEffect(() => {
    if (manualText !== editableText) {
      setEditableText(manualText);
    }
  }, [manualText]);

  // Track elapsed wait time when submission is in flight
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (submitting) {
      setElapsedWaitSeconds(0);
      timer = setInterval(() => {
        setElapsedWaitSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedWaitSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [submitting]);

  const handleClear = () => {
    setEditableText("");
    setManualText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSubmit = editableText.trim() || manualText.trim();
    if (!textToSubmit || submitting) return;
    onSubmit(textToSubmit);
  };

  const isListening = voiceState === "ready_to_listen" || voiceState === "user_speaking";
  const isTakingLong = submitting && elapsedWaitSeconds >= 8;

  const wordCount = (editableText || manualText).trim().split(/\s+/).filter(Boolean).length;
  const charCount = (editableText || manualText).length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const textToSubmit = editableText.trim() || manualText.trim();
      if (textToSubmit && !submitting) {
        onSubmit(textToSubmit);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-semibold text-foreground">
            {isListening ? "Live Spoken Transcript (Editable)" : "Your Answer Input"}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          {isListening && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-pulse">
              <span className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 bg-emerald-400 rounded-full wave-bar-1" />
                <span className="w-0.5 bg-emerald-400 rounded-full wave-bar-2" />
                <span className="w-0.5 bg-emerald-400 rounded-full wave-bar-3" />
                <span className="w-0.5 bg-emerald-400 rounded-full wave-bar-4" />
                <span className="w-0.5 bg-emerald-400 rounded-full wave-bar-5" />
              </span>
              <span>Mic Listening — Speak to Write</span>
            </div>
          )}
          {wordCount > 0 && (
            <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border/60">
              {wordCount} {wordCount === 1 ? "word" : "words"} • {charCount} chars
            </span>
          )}
        </div>
      </div>

      {/* Persistent Error / Retry Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>
              <strong>Submission Notice:</strong> {errorMessage} Your answer draft has been safely preserved below.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !(editableText.trim() || manualText.trim())}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-medium text-xs shrink-0 transition"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Taking Longer than expected Banner */}
      {isTakingLong && (
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>
              Evaluation is taking longer than usual ({elapsedWaitSeconds}s). Safe bounded timeout active...
            </span>
          </div>
          {onCancelSubmission && (
            <button
              type="button"
              onClick={onCancelSubmission}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium border border-amber-500/40"
            >
              <XCircle className="h-3 w-3" />
              Cancel Wait
            </button>
          )}
        </div>
      )}

      {/* Whisper Audio Transcribing Banner */}
      {isTranscribingAudio && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 animate-pulse">
          <Sparkles className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
          <span>Whisper AI is transcribing your audio directly into the answer box...</span>
        </div>
      )}

      {/* Transcript Input Area */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={editableText || manualText}
            onChange={(e) => {
              setEditableText(e.target.value);
              setManualText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "🎙️ Mic active! Speak your answer now. Your words will automatically appear right here in real-time..."
                : "Type your answer or click 'Start Speaking' to transcribe through your microphone... (Press Ctrl + Enter to submit)"
            }
            rows={4}
            disabled={submitting}
            className={`w-full rounded-xl border p-3.5 text-sm focus:outline-none resize-none disabled:opacity-60 placeholder:text-muted-foreground/60 leading-relaxed font-sans text-foreground shadow-inner transition-all ${
              isListening
                ? "border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-950/10"
                : "border-input bg-background/80 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
            }`}
          />

          {isListening && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium animate-pulse pointer-events-none border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Transcribing</span>
            </div>
          )}

          {isListening && interimTranscript && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium animate-pulse pointer-events-none">
              <Sparkles className="h-3 w-3" />
              <span>Hearing: "{interimTranscript}"</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {isListening
              ? "Speech recognition is active. You can edit or correct any words before clicking Submit."
              : "Draft preserved. Edit or correct misrecognized words before submitting."}
          </p>

          <div className="flex items-center gap-2">
            {/* Silence countdown pill inside panel if active */}
            {typeof silenceCountdown === "number" && silenceCountdown > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse">
                <span>Submitting in {silenceCountdown}s...</span>
                {onCancelSilenceCountdown && (
                  <button
                    type="button"
                    onClick={onCancelSilenceCountdown}
                    className="underline text-[10px] text-amber-200 hover:text-white ml-1 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {(editableText || manualText) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={submitting}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={submitting || !(editableText.trim() || manualText.trim())}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 cursor-pointer ${
                isListening
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 ring-1 ring-emerald-400/50"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
              }`}
            >
              {submitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Submitting...</span>
                </>
              ) : isListening ? (
                <>
                  <Send className="h-3.5 w-3.5 text-emerald-200" />
                  <span>Done Speaking (Submit)</span>
                  <span className="text-[10px] opacity-70 ml-1 font-mono">Ctrl+↵</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Answer</span>
                  <span className="text-[10px] opacity-70 ml-1 font-mono">Ctrl+↵</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
