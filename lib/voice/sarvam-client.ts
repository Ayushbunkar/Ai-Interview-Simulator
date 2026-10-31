import { getActiveSarvamKey } from "@/lib/config/cloud-fallback";

export interface SarvamTranscriptionResult {
  text: string;
  requestId?: string;
  languageCode?: string;
}

/**
 * Transcribes audio using Sarvam AI's Speech-to-Text API (Saaras v4 / Saarika model).
 * High-accuracy ASR optimized for English and Indian speech nuances.
 */
export async function transcribeWithSarvam(
  audioBuffer: Buffer,
  filename = "interview_audio.webm",
  apiKey?: string,
  languageCode = "en-IN"
): Promise<SarvamTranscriptionResult> {
  const token = apiKey || getActiveSarvamKey();
  if (!token) {
    throw new Error("Sarvam AI API key is not configured.");
  }

  const formData = new FormData();
  const uint8 = new Uint8Array(audioBuffer);
  const audioBlob = new Blob([uint8], { type: "audio/webm" });

  formData.append("file", audioBlob, filename);
  formData.append("language_code", languageCode);
  formData.append("model", "saaras:v4");
  formData.append("mode", "transcribe");

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": token,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Sarvam AI STT error [${response.status}]: ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    request_id?: string;
    transcript?: string;
    language_code?: string;
  };

  return {
    text: (data.transcript || "").trim(),
    requestId: data.request_id,
    languageCode: data.language_code,
  };
}
