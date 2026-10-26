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
        this.setStatus("permission_denied");
        this.options.onError?.("Microphone permission was denied. Please allow microphone access in your browser bar.");
      } else if (error === "no-speech") {
        // Normal silence timeout - keep listening if continuous
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Already active or restarting
          }
        }
      } else if (error === "network") {
        this.isListening = false;
        this.setStatus("error");
        if (this.options.onNetworkFallback) {
          this.options.onNetworkFallback();
        } else {
          this.options.onError?.("Browser speech recognition service is unavailable. Switching to Whisper AI Audio Recording...");
        }
      } else {
        this.isListening = false;
        this.setStatus("error");
        this.options.onError?.(`Speech recognition error (${error}). You can continue using Whisper audio input or text.`);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Auto-restart if continuous mode is expected and not explicitly stopped
        try {
          this.recognition.start();
        } catch {
          this.isListening = false;
          this.setStatus("idle");
        }
      } else {
        this.setStatus("idle");
      }
    };
  }

  public start(): boolean {
    if (!this.isSupportedBrowser || !this.recognition) {
      this.setStatus("unsupported");
      this.options.onError?.("Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or enter answers manually.");
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
      // If already started, ignore error
      if (err.name !== "InvalidStateError") {
        this.setStatus("error");
        this.options.onError?.("Failed to start microphone: " + (err.message || String(err)));
      }
      return false;
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop error
      }
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
}
