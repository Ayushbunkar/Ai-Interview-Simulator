/**
 * Zero-Additional-Cost Browser Speech Recognition Module
 * Uses native Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 */

export type SpeechRecognitionStatus =
  | "unsupported"
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "permission_denied";

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onStatusChange?: (status: SpeechRecognitionStatus) => void;
  onError?: (errorMessage: string) => void;
  onNetworkFallback?: () => void;
}

export class BrowserSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private status: SpeechRecognitionStatus = "idle";
  private finalTranscript: string = "";
  private interimTranscript: string = "";
  private options: SpeechRecognitionOptions;
  private isSupportedBrowser: boolean = false;
  private restartTimer: any = null;

  constructor(options: SpeechRecognitionOptions = {}) {
    this.options = {
      continuous: true,
      interimResults: true,
      lang: "en-US",
      ...options,
    };

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupportedBrowser = true;
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = this.options.continuous ?? true;
          this.recognition.interimResults = this.options.interimResults ?? true;
          this.recognition.lang = this.options.lang || "en-US";
          this.bindEvents();
        } catch (err: any) {
          console.warn("SpeechRecognition initialization failed:", err);
          this.isSupportedBrowser = false;
        }
      } else {
        this.status = "unsupported";
        this.options.onStatusChange?.("unsupported");
      }
    }
  }

  public isSupported(): boolean {
    return this.isSupportedBrowser;
  }

  public getStatus(): SpeechRecognitionStatus {
    return this.status;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  private setStatus(status: SpeechRecognitionStatus) {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private bindEvents() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.setStatus("listening");
    };

    this.recognition.onresult = (event: any) => {
      let currentInterim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const transcriptSegment = item[0]?.transcript || "";
        if (item.isFinal) {
          this.finalTranscript += (this.finalTranscript ? " " : "") + transcriptSegment.trim();
          this.options.onFinalTranscript?.(this.finalTranscript);
        } else {
          currentInterim += transcriptSegment;
        }
      }
      this.interimTranscript = currentInterim;
      this.options.onInterimTranscript?.(currentInterim);
    };

    this.recognition.onerror = (event: any) => {
      const error = event.error || "unknown";
      if (error === "not-allowed") {
        this.isListening = false;
        this.setStatus("permission_denied");
        this.options.onError?.("Microphone permission was denied. Please allow microphone access in your browser address bar.");
      } else if (error === "no-speech") {
        // Normal silence event in Chrome - onend will fire and restart safely
      } else if (error === "network") {
        console.warn("Browser Web Speech API network event encountered.");
        if (this.options.onNetworkFallback) {
          this.options.onNetworkFallback();
        }
      } else if (error !== "aborted") {
        console.warn(`Speech recognition event (${error}).`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Debounce restart after small delay to let browser release audio stream
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start();
              this.setStatus("listening");
            } catch (err: any) {
              if (err.name !== "InvalidStateError") {
                setTimeout(() => {
                  if (this.isListening && this.recognition) {
                    try {
                      this.recognition.start();
                      this.setStatus("listening");
                    } catch {}
                  }
                }, 300);
              }
            }
          }
        }, 150);
      } else {
        this.setStatus("idle");
      }
    };
  }

  public start(): boolean {
    if (!this.isSupportedBrowser || !this.recognition) {
      this.setStatus("unsupported");
      this.options.onError?.("Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or click Record Voice (Whisper AI).");
      return false;
    }

    try {
      this.finalTranscript = "";
      this.interimTranscript = "";
      this.isListening = true;
      this.recognition.start();
      this.setStatus("listening");
      return true;
    } catch (err: any) {
      if (err.name === "InvalidStateError") {
        // Already listening
        this.isListening = true;
        this.setStatus("listening");
        return true;
      }
      this.setStatus("error");
      this.options.onError?.("Failed to start microphone: " + (err.message || String(err)));
      return false;
    }
  }

  public stop() {
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.setStatus("idle");
  }

  public resetTranscript() {
    this.finalTranscript = "";
    this.interimTranscript = "";
  }

  public getFinalTranscript(): string {
    return this.finalTranscript;
  }

  public getInterimTranscript(): string {
    return this.interimTranscript;
  }
}
