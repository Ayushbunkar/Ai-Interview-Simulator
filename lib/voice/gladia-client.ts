import { getActiveGladiaKey } from "@/lib/config/cloud-fallback";

export interface GladiaTranscriptionResult {
  text: string;
  id: string;
}

/**
 * Transcribes audio buffer using Gladia API v2 (Upload -> Pre-recorded -> Polling).
 * Ultra-fast, highly accurate multilingual Speech-to-Text engine.
 */
export async function transcribeWithGladia(
  audioBuffer: Buffer,
  filename = "interview_audio.webm",
  apiKey?: string
): Promise<GladiaTranscriptionResult> {
  const token = apiKey || getActiveGladiaKey();
  if (!token) {
    throw new Error("Gladia API key is not configured.");
  }

  // 1. Upload the audio file to Gladia
  const formData = new FormData();
  const uint8 = new Uint8Array(audioBuffer);
  const audioBlob = new Blob([uint8], { type: "audio/webm" });
  formData.append("audio", audioBlob, filename);

  const uploadRes = await fetch("https://api.gladia.io/v2/upload", {
    method: "POST",
    headers: {
      "x-gladia-key": token,
    },
    body: formData,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "");
    throw new Error(`Gladia audio upload failed [${uploadRes.status}]: ${errText || uploadRes.statusText}`);
  }

  const uploadData = (await uploadRes.json()) as { audio_url?: string };
  if (!uploadData.audio_url) {
    throw new Error("Gladia upload did not return an audio_url.");
  }

  // 2. Initiate pre-recorded transcription job
  const preRes = await fetch("https://api.gladia.io/v2/pre-recorded", {
    method: "POST",
    headers: {
      "x-gladia-key": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: uploadData.audio_url,
    }),
  });

  if (!preRes.ok) {
    const errText = await preRes.text().catch(() => "");
    throw new Error(`Gladia job initiation failed [${preRes.status}]: ${errText || preRes.statusText}`);
  }

  const preData = (await preRes.json()) as { id?: string; result_url?: string };
  const jobId = preData.id;
  if (!jobId) {
    throw new Error("Gladia pre-recorded response did not contain a job ID.");
  }

  // 3. Poll for completion (up to 20 seconds)
  const maxAttempts = 20;
  const pollIntervalMs = 900;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const pollRes = await fetch(`https://api.gladia.io/v2/pre-recorded/${jobId}`, {
      headers: {
        "x-gladia-key": token,
      },
    });

    if (!pollRes.ok) continue;

    const pollData = (await pollRes.json()) as {
      status?: "queued" | "processing" | "done" | "error";
      result?: {
        transcription?: {
          full_transcript?: string;
        };
      };
      error?: any;
    };

    if (pollData.status === "done") {
      const fullTranscript = pollData.result?.transcription?.full_transcript || "";
      return {
        text: fullTranscript.trim(),
        id: jobId,
      };
    }

    if (pollData.status === "error") {
      throw new Error(`Gladia transcription failed: ${JSON.stringify(pollData.error || "Unknown error")}`);
    }
  }

  throw new Error(`Gladia transcription job ${jobId} timed out.`);
}
