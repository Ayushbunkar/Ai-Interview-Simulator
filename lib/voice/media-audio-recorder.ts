/**
 * High-Reliability Browser Audio Recorder with Groq Whisper Cloud STT
 * Bypasses Chrome's closed Web Speech API network errors entirely by capturing
 * raw microphone audio locally via standard MediaRecorder and transcribing with Whisper.
 */

export interface AudioRecorderOptions {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onTranscribing?: () => void;
  onTranscript?: (text: string) => void;
  onError?: (errorMessage: string) => void;
}

export class MediaAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isCurrentlyRecording: boolean = false;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = options;
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }

  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  public async start(): Promise<boolean> {
    if (!this.isSupported()) {
      this.options.onError?.("Audio recording is not supported in this browser.");
      return false;
    }

    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Select supported mimeType
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "",
      ];
      let selectedMime = "";
      for (const m of mimeTypes) {
        if (!m || MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(this.stream, { mimeType: selectedMime })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isCurrentlyRecording = true;
        this.options.onRecordingStart?.();
      };

      this.mediaRecorder.onstop = () => {
        this.isCurrentlyRecording = false;
        this.cleanupStream();
        this.options.onRecordingStop?.();
      };

      this.mediaRecorder.onerror = (err: any) => {
        this.cleanupStream();
        this.options.onError?.("Audio recording error: " + (err.error?.message || err.message || "Unknown error"));
      };

      this.mediaRecorder.start(250); // Slice chunks every 250ms
      return true;
    } catch (err: any) {
      this.cleanupStream();
      const isDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
      const msg = isDenied
        ? "Microphone access was denied. Please allow microphone permission in your browser."
        : "Failed to access microphone: " + (err.message || String(err));
      this.options.onError?.(msg);
      return false;
    }
  }

  public async stop(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.isCurrentlyRecording) {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isCurrentlyRecording = false;
        this.cleanupStream();
        this.options.onRecordingStop?.();

        const mime = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mime });
        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Stops recording and sends the audio to /api/voice/transcribe via Whisper.
   */
  public async stopAndTranscribe(): Promise<string | null> {
    const blob = await this.stop();
    if (!blob || blob.size === 0) {
      this.options.onError?.("No audio recorded. Please hold the button or speak while recording.");
      return null;
    }

    this.options.onTranscribing?.();

    try {
      const formData = new FormData();
      // Whisper supports .webm, .wav, .mp3, .mp4, .m4a
      const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("ogg") ? "ogg" : "webm";
      formData.append("file", blob, `interview_voice_${Date.now()}.${ext}`);

      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to transcribe audio.");
      }

      const text = (data.text || "").trim();
      this.options.onTranscript?.(text);
      return text;
    } catch (err: any) {
      const msg = err.message || "Failed to transcribe speech.";
      this.options.onError?.(msg);
      return null;
    }
  }

  private cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}
