import { BrowserSpeechRecognizer } from "./speech-recognition";
import { BrowserSpeechSynthesizer } from "./speech-synthesis";
import { MediaAudioRecorder } from "./media-audio-recorder";
import { VoiceState } from "../types";

export interface VoiceControllerCallbacks {
  onStateChange: (state: VoiceState) => void;
  onInterimTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (msg: string) => void;
}

export class VoiceSessionController {
  private recognizer: BrowserSpeechRecognizer;
  private synthesizer: BrowserSpeechSynthesizer;
  private audioRecorder: MediaAudioRecorder;
  private state: VoiceState = "idle";
  private isVoiceModeEnabled: boolean = true;
  private isWhisperMode: boolean = false;
  private callbacks: VoiceControllerCallbacks;
  private lastSpokenMessageId: string | null = null;

  constructor(callbacks: VoiceControllerCallbacks) {
    this.callbacks = callbacks;

    this.recognizer = new BrowserSpeechRecognizer({
      onInterimTranscript: (interim) => {
        if (this.state === "ready_to_listen" && interim.trim().length > 0) {
          this.setState("user_speaking");
        }
        this.callbacks.onInterimTranscript(interim);
      },
      onFinalTranscript: (final) => {
        this.callbacks.onFinalTranscript(final);
      },
      onStatusChange: (status) => {
        if (status === "listening" && this.state !== "user_speaking") {
          this.setState("ready_to_listen");
        } else if (status === "idle" && this.state === "ready_to_listen") {
          // Stay ready unless transition requested
        } else if (status === "error" || status === "permission_denied") {
          this.setState("error");
        }
      },
      onError: (err) => {
        this.callbacks.onError(err);
      },
      onNetworkFallback: () => {
        // Automatically switch to Whisper Audio Recorder when Chrome's speech server fails
        this.isWhisperMode = true;
        this.setState("ready_to_listen");
        this.callbacks.onError(
          "Browser speech service is unavailable on your network. Switched to Whisper AI Audio Recording. Click 'Record Answer (Whisper)' to speak."
        );
      },
    });

    this.audioRecorder = new MediaAudioRecorder({
      onRecordingStart: () => {
        this.setState("user_speaking");
      },
      onRecordingStop: () => {
        // Stop recording event
      },
      onTranscribing: () => {
        this.callbacks.onInterimTranscript("");
      },
      onTranscript: (text) => {
        this.callbacks.onInterimTranscript("");
        this.callbacks.onFinalTranscript(text);
        this.setState("ready_to_listen");
      },
      onError: (msg) => {
        this.callbacks.onInterimTranscript("");
        this.callbacks.onError(msg);
        this.setState("error");
      },
    });

    this.synthesizer = new BrowserSpeechSynthesizer();
  }

  public getState(): VoiceState {
    return this.state;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  public setVoiceMode(enabled: boolean) {
    this.isVoiceModeEnabled = enabled;
    if (!enabled) {
      this.recognizer.stop();
      if (this.audioRecorder.isRecording()) {
        this.audioRecorder.stop();
      }
      this.synthesizer.stop();
      this.setState("idle");
    }
  }

  public isVoiceMode(): boolean {
    return this.isVoiceModeEnabled;
  }

  public isUsingWhisperMode(): boolean {
    return this.isWhisperMode;
  }

  public setWhisperMode(enabled: boolean) {
    this.isWhisperMode = enabled;
  }

  public isAudioRecording(): boolean {
    return this.audioRecorder.isRecording();
  }

  public isInterviewerSpeaking(): boolean {
    return this.state === "interviewer_speaking" || this.synthesizer.getIsSpeaking();
  }

  /**
   * Called when an interviewer message needs to be spoken.
   * Ensures idempotency: will not repeat identical message IDs on React rerenders.
   */
  public speakInterviewerMessage(messageId: string, text: string) {
    if (!this.isVoiceModeEnabled || !this.synthesizer.isSupported()) {
      return;
    }

    if (this.lastSpokenMessageId === messageId) {
      // Avoid duplicate re-speaking of same message
      return;
    }

    this.lastSpokenMessageId = messageId;
    this.recognizer.stop();
    if (this.audioRecorder.isRecording()) {
      this.audioRecorder.stop();
    }
    this.setState("interviewer_speaking");

    // Safety fallback timer in case browser TTS event stalls or fails to fire onEnd
    const safetyMs = Math.max(3000, Math.min(25000, (text.length / 15) * 1000 + 2000));
    setTimeout(() => {
      if (this.isVoiceModeEnabled && this.state === "interviewer_speaking") {
        this.startListening();
      }
    }, safetyMs);

    this.synthesizer.speak(text, messageId, {
      onStart: () => {
        this.setState("interviewer_speaking");
      },
      onEnd: () => {
        if (this.isVoiceModeEnabled && this.state === "interviewer_speaking") {
          this.startListening();
        } else {
          this.setState("idle");
        }
      },
      onError: () => {
        if (this.isVoiceModeEnabled) {
          this.startListening();
        } else {
          this.setState("idle");
        }
      },
    });
  }

  /**
   * Starts dual recording:
   * 1. Browser Speech Recognizer (for zero-latency real-time preview if available)
   * 2. MediaRecorder audio buffer (for 100% reliable Whisper AI fallback so words are never lost)
   */
  public async startListening(forceLive = false) {
    this.synthesizer.stop();
    this.recognizer.resetTranscript();

    // 1. Always record microphone audio locally via MediaRecorder
    if (this.audioRecorder.isSupported()) {
      try {
        await this.audioRecorder.start();
      } catch (err) {
        console.warn("Background MediaRecorder start note:", err);
      }
    }

    // 2. Also start Web Speech API for real-time live word streaming
    if (this.recognizer.isSupported()) {
      try {
        this.recognizer.start();
      } catch (err) {
        console.warn("Web Speech recognizer start note:", err);
      }
    }

    this.setState("ready_to_listen");
  }

  /**
   * Stops listening
   */
  public stopListening() {
    this.recognizer.stop();
    if (this.audioRecorder.isRecording()) {
      this.audioRecorder.stop();
    }
    if (this.state === "ready_to_listen" || this.state === "user_speaking") {
      this.setState("idle");
    }
  }

  /**
   * Stops listening and returns best transcribed text:
   * If live Web Speech API captured >= 3 words, returns it immediately.
   * If live Web Speech was empty/failed, automatically transcribes the recorded audio via Whisper AI!
   */
  public async stopAndGetTranscript(): Promise<string> {
    const liveText = this.recognizer.getFinalTranscript();
    this.recognizer.stop();

    const liveWords = liveText.trim().split(/\s+/).filter(Boolean);
    // If live text produced an answer, use it and stop audio recorder
    if (liveWords.length >= 3) {
      if (this.audioRecorder.isRecording()) {
        await this.audioRecorder.stop();
      }
      this.setState("idle");
      return liveText.trim();
    }

    // If live text was empty/insufficient, transcribe via Whisper AI
    if (this.audioRecorder.isRecording()) {
      this.callbacks.onInterimTranscript("Transcribing audio with Whisper AI...");
      const whisperText = await this.audioRecorder.stopAndTranscribe();
      this.callbacks.onInterimTranscript("");
      this.setState("idle");
      if (whisperText && whisperText.trim()) {
        this.callbacks.onFinalTranscript(whisperText.trim());
        return whisperText.trim();
      }
    }

    this.setState("idle");
    return liveText.trim();
  }

  /**
   * Starts Whisper microphone recording via MediaRecorder
   */
  public async startWhisperRecording(): Promise<boolean> {
    this.synthesizer.stop();
    this.recognizer.stop();
    this.isWhisperMode = true;
    const started = await this.audioRecorder.start();
    if (started) {
      this.setState("user_speaking");
    }
    return started;
  }

  /**
   * Stops Whisper recording and sends audio to Whisper STT endpoint
   */
  public async stopAndTranscribeWhisper(): Promise<string | null> {
    const text = await this.audioRecorder.stopAndTranscribe();
    if (this.state === "user_speaking") {
      this.setState("ready_to_listen");
    }
    return text;
  }

  /**
   * Candidate Interrupt Action:
   * Instantly stops interviewer speech, prepares to capture candidate's counterquestion
   */
  public interruptInterviewer() {
    this.synthesizer.stop();
    this.recognizer.stop();
    if (this.audioRecorder.isRecording()) {
      this.audioRecorder.stop();
    }
    this.recognizer.resetTranscript();
    this.setState("ready_to_listen");
    this.startListening();
  }

  public stopSpeaking() {
    this.synthesizer.stop();
    if (this.state === "interviewer_speaking") {
      this.setState("idle");
    }
  }

  public replayCurrentQuestion(text: string) {
    this.synthesizer.stop();
    this.recognizer.stop();
    if (this.audioRecorder.isRecording()) {
      this.audioRecorder.stop();
    }
    this.setState("interviewer_speaking");
    this.synthesizer.speak(text, "replay-" + Date.now(), {
      onEnd: () => {
        if (this.isVoiceModeEnabled) {
          this.startListening();
        } else {
          this.setState("idle");
        }
      },
    });
  }

  public notifySubmissionStarted() {
    this.recognizer.stop();
    if (this.audioRecorder.isRecording()) {
      this.audioRecorder.stop();
    }
    this.setState("processing_answer");
  }

  public notifyThinking() {
    this.setState("interviewer_thinking");
  }

  public getFinalTranscript(): string {
    return this.recognizer.getFinalTranscript();
  }

  public resetTranscript() {
    this.recognizer.resetTranscript();
  }

  public getSpeechSynthesizer(): BrowserSpeechSynthesizer {
    return this.synthesizer;
  }

  public getSpeechRecognizer(): BrowserSpeechRecognizer {
    return this.recognizer;
  }

  public getAudioRecorder(): MediaAudioRecorder {
    return this.audioRecorder;
  }
}
