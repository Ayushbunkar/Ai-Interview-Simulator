/**
 * Zero-Additional-Cost Browser Speech Synthesis Module
 * Uses native window.speechSynthesis and SpeechSynthesisUtterance
 */

export interface SpeechSynthesisOptions {
  rate?: number; // 0.75 - 1.5, default 1.0
  pitch?: number; // 0.8 - 1.2, default 1.0
  voiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class BrowserSpeechSynthesizer {
  private isSpeaking: boolean = false;
  private currentUtteranceId: string | null = null;
  private currentText: string = "";
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private selectedVoiceURI: string | null = null;
  private isSupportedBrowser: boolean = false;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.isSupportedBrowser = true;
    }
  }

  public isSupported(): boolean {
    return this.isSupportedBrowser;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupportedBrowser) return [];
    return window.speechSynthesis.getVoices();
  }

  public setVoice(voiceURI: string) {
    this.selectedVoiceURI = voiceURI;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public speak(text: string, utteranceId?: string, options: SpeechSynthesisOptions = {}) {
    if (!this.isSupportedBrowser) {
      options.onEnd?.();
      return;
    }

    // Cancel any ongoing or pending speech to avoid collisions
    this.stop();

    if (!text || text.trim().length === 0) {
      options.onEnd?.();
      return;
    }

    // Strip Markdown symbols for clean and natural speech output
    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, "Code block provided onscreen.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/>/g, "")
      .trim();

    this.currentText = text;
    this.currentUtteranceId = utteranceId || "utt-" + Date.now();
    this.onStartCallback = options.onStart;
    this.onEndCallback = options.onEnd;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = options.rate || this.rate;
    utterance.pitch = options.pitch || this.pitch;

    // Pick selected voice or suitable English voice
    const voices = this.getVoices();
    if (this.selectedVoiceURI) {
      const found = voices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (found) utterance.voice = found;
    } else {
      // Preference: Natural/Google/Microsoft English voices
      const preferred = voices.find(
        v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
      ) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.onStartCallback?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtteranceId = null;
      this.onEndCallback?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtteranceId = null;
      options.onError?.(e);
      this.onEndCallback?.();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis error:", err);
      this.isSpeaking = false;
      this.onEndCallback?.();
    }
  }

  public pause() {
    if (this.isSupportedBrowser && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (this.isSupportedBrowser && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  public stop() {
    if (this.isSupportedBrowser) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.isSpeaking = false;
    this.currentUtteranceId = null;
  }

  public replay(options: SpeechSynthesisOptions = {}) {
    if (this.currentText) {
      this.speak(this.currentText, this.currentUtteranceId || undefined, options);
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getCurrentUtteranceId(): string | null {
    return this.currentUtteranceId;
  }
}
