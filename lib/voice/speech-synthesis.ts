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
      try {
        const saved = localStorage.getItem("interviewforge_voice_uri");
        if (saved) this.selectedVoiceURI = saved;
        const savedRate = localStorage.getItem("interviewforge_voice_rate");
        if (savedRate) {
          const r = parseFloat(savedRate);
          if (!isNaN(r)) this.rate = r;
        }
      } catch {}
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
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("interviewforge_voice_uri", voiceURI);
      } catch {}
    }
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("interviewforge_voice_rate", String(this.rate));
      } catch {}
    }
  }

  public getCurrentText(): string {
    return this.currentText;
  }

  public getSelectedVoiceURI(): string | null {
    return this.selectedVoiceURI;
  }

  public getRate(): number {
    return this.rate;
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

    // Dynamic rate resolution (check localStorage to honor user settings)
    let activeRate = options.rate || this.rate;
    if (typeof window !== "undefined") {
      try {
        const savedRate = localStorage.getItem("interviewforge_voice_rate");
        if (savedRate) {
          const r = parseFloat(savedRate);
          if (!isNaN(r)) activeRate = r;
        }
      } catch {}
    }
    utterance.rate = activeRate;
    utterance.pitch = options.pitch || this.pitch;

    // Guaranteed Voice Resolution from browser localStorage setting
    let activeVoiceTarget = options.voiceURI || this.selectedVoiceURI;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("interviewforge_voice_uri");
        if (saved) activeVoiceTarget = saved;
      } catch {}
    }

    const voices = this.getVoices();
    let foundVoice: SpeechSynthesisVoice | undefined;

    if (activeVoiceTarget && voices.length > 0) {
      const target = activeVoiceTarget.toLowerCase().trim();

      // 1. Exact match on voiceURI or name
      foundVoice = voices.find(
        v => (v.voiceURI && v.voiceURI.toLowerCase().trim() === target) ||
             (v.name && v.name.toLowerCase().trim() === target)
      );

      // 2. Substring matching (e.g. "Microsoft Heera" matching full name or vice-versa)
      if (!foundVoice) {
        foundVoice = voices.find(v => {
          const vUri = (v.voiceURI || "").toLowerCase().trim();
          const vName = (v.name || "").toLowerCase().trim();
          return (vUri && target.includes(vUri)) ||
                 (vUri && vUri.includes(target)) ||
                 (vName && target.includes(vName)) ||
                 (vName && vName.includes(target));
        });
      }

      // 3. Match by distinct speaker character (Heera, Ravi, David, Zira, Mark, Cleveland)
      if (!foundVoice) {
        const speakerKeys = ["heera", "ravi", "david", "zira", "mark", "cleveland", "george", "susan", "hazel", "catherine", "james", "richard", "linda", "google", "samantha"];
        const matchedKey = speakerKeys.find(k => target.includes(k));
        if (matchedKey) {
          foundVoice = voices.find(v => 
            (v.name && v.name.toLowerCase().includes(matchedKey)) ||
            (v.voiceURI && v.voiceURI.toLowerCase().includes(matchedKey))
          );
        }
      }
    }

    if (foundVoice) {
      utterance.voice = foundVoice;
      utterance.lang = foundVoice.lang; // Critical on Windows Chromium to match selected voice
    } else {
      // Fallback preference: Indian English (Heera / Ravi) or Natural/Google English
      const preferred = voices.find(
        v => v.lang.startsWith("en") && (v.name.includes("Heera") || v.name.includes("Ravi") || v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("David"))
      ) || voices.find(v => v.lang.startsWith("en"));
      if (preferred) {
        utterance.voice = preferred;
        utterance.lang = preferred.lang;
      }
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
