import { BrowserSpeechRecognizer } from "./speech-recognition";
import { BrowserSpeechSynthesizer } from "./speech-synthesis";
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
  private state: VoiceState = "idle";
  private isVoiceModeEnabled: boolean = true;
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
      this.synthesizer.stop();
      this.setState("idle");
    }
  }

  public isVoiceMode(): boolean {
    return this.isVoiceModeEnabled;
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
    this.setState("interviewer_speaking");

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
   * Starts listening for candidate's voice answer
   */
  public startListening() {
    this.synthesizer.stop();
    this.recognizer.resetTranscript();
    const started = this.recognizer.start();
    if (started) {
      this.setState("ready_to_listen");
    }
  }

  /**
   * Stops listening
   */
  public stopListening() {
    this.recognizer.stop();
    if (this.state === "ready_to_listen" || this.state === "user_speaking") {
      this.setState("idle");
    }
  }

  /**
   * Candidate Interrupt Action:
   * Instantly stops interviewer speech, prepares to capture candidate's counterquestion
   */
  public interruptInterviewer() {
    this.synthesizer.stop();
    this.recognizer.stop();
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
    this.setState("processing_answer");
  }

  public notifyThinking() {
    this.setState("interviewer_thinking");
  }

  public getSpeechSynthesizer(): BrowserSpeechSynthesizer {
    return this.synthesizer;
  }

  public getSpeechRecognizer(): BrowserSpeechRecognizer {
    return this.recognizer;
  }
}
