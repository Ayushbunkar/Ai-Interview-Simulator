import { getActiveSpeechmaticsKey } from "@/lib/config/cloud-fallback";

export interface SpeechmaticsTranscriptionResult {
  text: string;
  jobId: string;
  duration?: number;
}

/**
 * Transcribes audio buffer using Speechmatics Batch ASR API (v2).
 * Fast, accurate fallback when AssemblyAI quotas/tokens are exhausted.
 */
export async function transcribeWithSpeechmatics(
  audioBuffer: Buffer,
  filename = "recording.webm",
  apiKey?: string
): Promise<SpeechmaticsTranscriptionResult> {
  const token = apiKey || getActiveSpeechmaticsKey();
  if (!token) {
    throw new Error("Speechmatics API key is not configured.");
  }

  const formData = new FormData();
  // Safe Uint8Array copy from Buffer for Blob construction
  const uint8 = new Uint8Array(audioBuffer);
  const audioBlob = new Blob([uint8], { type: "audio/webm" });
  formData.append("data_file", audioBlob, filename);

  const config = {
    type: "transcription",
    transcription_config: {
      language: "en",
      operating_point: "standard", // standard or enhanced
      enable_entities: true,
    },
  };
  formData.append("config", JSON.stringify(config));

  // 1. Submit Job
  const submitRes = await fetch("https://asr.api.speechmatics.com/v2/jobs/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text().catch(() => "");
    throw new Error(
      `Speechmatics job submission failed [${submitRes.status}]: ${errorText || submitRes.statusText}`
    );
  }

  const submitData = (await submitRes.json()) as { id: string; details?: any };
  const jobId = submitData.id;
  if (!jobId) {
    throw new Error("Speechmatics returned no job ID.");
  }

  // 2. Poll for Completion (up to 20 seconds, checking every 800ms)
  const maxAttempts = 25;
  const pollIntervalMs = 800;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const statusRes = await fetch(`https://asr.api.speechmatics.com/v2/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!statusRes.ok) {
      continue;
    }

    const jobInfo = (await statusRes.json()) as {
      job?: {
        status: "running" | "done" | "rejected" | "deleted";
        duration?: number;
        errors?: any[];
      };
    };

    const status = jobInfo.job?.status;

    if (status === "done") {
      // 3. Fetch Plain-Text Transcript
      const textRes = await fetch(
        `https://asr.api.speechmatics.com/v2/jobs/${jobId}/transcript?format=txt`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!textRes.ok) {
        throw new Error(`Failed to retrieve transcript text for job ${jobId}`);
      }

      const rawText = await textRes.text();
      return {
        text: rawText.trim(),
        jobId,
        duration: jobInfo.job?.duration,
      };
    }

    if (status === "rejected") {
      const errorDetail = JSON.stringify(jobInfo.job?.errors || "Job rejected");
      throw new Error(`Speechmatics job ${jobId} was rejected: ${errorDetail}`);
    }
  }

  throw new Error(`Speechmatics job ${jobId} timed out after polling.`);
}
