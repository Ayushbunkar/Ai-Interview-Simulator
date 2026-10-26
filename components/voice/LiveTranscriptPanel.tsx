"use client";

import { useState, useEffect } from "react";
import { Send, Edit3, RotateCcw, Keyboard, Mic, Sparkles, Check } from "lucide-react";
import { VoiceState } from "@/lib/types";

interface LiveTranscriptPanelProps {
  voiceState: VoiceState;
  interimTranscript: string;
  finalTranscript: string;
  onSubmit: (text: string) => void;
  submitting: boolean;
  manualText: string;
  setManualText: (text: string) => void;
}

export function LiveTranscriptPanel({
  voiceState,
  interimTranscript,
  finalTranscript,
  onSubmit,
  submitting,
  manualText,
  setManualText,
}: LiveTranscriptPanelProps) {
  const [editableText, setEditableText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Sync incoming speech recognition transcript
  useEffect(() => {
    if (finalTranscript || interimTranscript) {
      const full = (finalTranscript + (interimTranscript ? " " + interimTranscript : "")).trim();
      setEditableText(full);
      setManualText(full);
    }
  }, [finalTranscript, interimTranscript, setManualText]);

  const handleClear = () => {
    setEditableText("");
    setManualText("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSubmit = editableText.trim() || manualText.trim();
    if (!textToSubmit || submitting) return;
    onSubmit(textToSubmit);
    setEditableText("");
    setManualText("");
  };

  const isListening = voiceState === "ready_to_listen" || voiceState === "user_speaking";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-semibold text-foreground">
            {isListening ? "Live Spoken Transcript (Editable)" : "Your Answer Input"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isListening && (
            <span className="flex items-center gap-1 text-emerald-500 font-medium animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Mic Active
            </span>
          )}
        </div>
      </div>

      {/* Transcript Input Area */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={editableText || manualText}
            onChange={(e) => {
              setEditableText(e.target.value);
              setManualText(e.target.value);
            }}
            placeholder={
              isListening
                ? "Listening... Speak naturally. Your transcribed words will appear here in real-time."
                : "Type your answer or click 'Speak Answer' to speak through your microphone..."
            }
            rows={4}
            disabled={submitting}
            className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-60 placeholder:text-muted-foreground/60 leading-relaxed font-sans"
          />

          {isListening && interimTranscript && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-medium animate-pulse pointer-events-none">
              <Sparkles className="h-3 w-3" />
              transcribing speech...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {(editableText || manualText) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={submitting}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs text-muted-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            )}
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Feel free to edit or correct misrecognized words before submitting.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting || !(editableText.trim() || manualText.trim())}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Evaluating...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit Answer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
