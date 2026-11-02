import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import Groq from "groq-sdk";
import {
  getAssemblyAIKeys,
  getActiveGroqKey,
  getActiveSpeechmaticsKey,
  getActiveGladiaKey,
  getActiveSarvamKey,
} from "@/lib/config/cloud-fallback";
import { transcribeWithSpeechmatics } from "@/lib/voice/speechmatics-client";
import { transcribeWithGladia } from "@/lib/voice/gladia-client";
import { transcribeWithSarvam } from "@/lib/voice/sarvam-client";

/**
 * Ensures transcribed text is in clean English.
 * If an ASR engine incorrectly outputs Hindi Devanagari script,
 * converts or transliterates it back to technical English terminology.
 */
async function ensureEnglishTranscript(text: string, groqKey?: string | null): Promise<string> {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";

  // Check if text contains Devanagari Hindi characters (\u0900-\u097F)
  const hasDevanagari = /[\u0900-\u097F]/.test(trimmed);
  if (!hasDevanagari) {
    return trimmed;
  }

  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert technical interview speech-to-text transliterator. The candidate answered a technical computer science interview question in English, but an ASR engine incorrectly transcribed it into Hindi Devanagari script. Transliterate or translate this back into natural, accurate, fluent English technical terminology. Return ONLY the English text with no quotes, commentary, or markdown.",
          },
          {
            role: "user",
            content: trimmed,
          },
        ],
        temperature: 0.1,
      });
      const converted = completion.choices[0]?.message?.content?.trim();
      if (converted) {
        return converted;
      }
    } catch (err: any) {
      console.warn("Devanagari English conversion notice:", err.message || err);
    }
  }

  return trimmed;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    if (audioBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Audio file is empty. Please speak into your microphone." },
        { status: 400 }
      );
    }

    const assemblyKeys = getAssemblyAIKeys();
    const groqKey = getActiveGroqKey();

    // -------------------------------------------------------------
    // TIER 1: AssemblyAI Primary Key
    // -------------------------------------------------------------
    if (assemblyKeys.length > 0 && assemblyKeys[0]) {
      const primaryKey = assemblyKeys[0];
      try {
        const client = new AssemblyAI({ apiKey: primaryKey });
        const transcript = await client.transcripts.transcribe({
          audio: audioBuffer,
          language_code: "en_us",
          punctuate: true,
          format_text: true,
        });

        if (transcript.status === "completed" && transcript.text) {
          const englishText = await ensureEnglishTranscript(transcript.text, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "assemblyai-primary",
            confidence: transcript.confidence,
          });
        } else if (transcript.status === "error") {
          throw new Error(transcript.error || "AssemblyAI Primary returned error status.");
        }
      } catch (err: any) {
        console.warn("AssemblyAI Primary STT failed. Trying Secondary Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 2: AssemblyAI Secondary Fallback Key
    // -------------------------------------------------------------
    if (assemblyKeys.length > 1 && assemblyKeys[1]) {
      const secondaryKey = assemblyKeys[1];
      try {
        const client = new AssemblyAI({ apiKey: secondaryKey });
        const transcript = await client.transcripts.transcribe({
          audio: audioBuffer,
          language_code: "en_us",
          punctuate: true,
          format_text: true,
        });

        if (transcript.status === "completed" && transcript.text) {
          const englishText = await ensureEnglishTranscript(transcript.text, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "assemblyai-secondary",
            confidence: transcript.confidence,
          });
        } else if (transcript.status === "error") {
          throw new Error(transcript.error || "AssemblyAI Secondary returned error status.");
        }
      } catch (err: any) {
        console.warn("AssemblyAI Secondary STT failed. Trying Speechmatics Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 3: Speechmatics Fallback Engine (when AssemblyAI tokens exhausted)
    // -------------------------------------------------------------
    const speechmaticsKey = getActiveSpeechmaticsKey();
    if (speechmaticsKey) {
      try {
        const speechmaticsRes = await transcribeWithSpeechmatics(
          audioBuffer,
          file.name || "interview_answer.webm",
          speechmaticsKey
        );

        if (speechmaticsRes.text) {
          const englishText = await ensureEnglishTranscript(speechmaticsRes.text, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "speechmatics-fallback",
            jobId: speechmaticsRes.jobId,
          });
        }
      } catch (err: any) {
        console.warn("Speechmatics STT fallback error. Trying Gladia Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 4: Gladia v2 Multilingual STT Engine (Solaria)
    // -------------------------------------------------------------
    const gladiaKey = getActiveGladiaKey();
    if (gladiaKey) {
      try {
        const gladiaRes = await transcribeWithGladia(
          audioBuffer,
          file.name || "interview_answer.webm",
          gladiaKey
        );

        if (gladiaRes.text) {
          const englishText = await ensureEnglishTranscript(gladiaRes.text, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "gladia-fallback",
            jobId: gladiaRes.id,
          });
        }
      } catch (err: any) {
        console.warn("Gladia STT fallback error. Trying Sarvam AI Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 5: Sarvam AI Indic/English STT Engine (saaras:v4)
    // -------------------------------------------------------------
    const sarvamKey = getActiveSarvamKey();
    if (sarvamKey) {
      try {
        const sarvamRes = await transcribeWithSarvam(
          audioBuffer,
          file.name || "interview_answer.wav",
          sarvamKey,
          "en-IN"
        );

        if (sarvamRes.text) {
          const englishText = await ensureEnglishTranscript(sarvamRes.text, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "sarvam-ai-fallback",
            requestId: sarvamRes.requestId,
            languageCode: sarvamRes.languageCode,
          });
        }
      } catch (err: any) {
        console.warn("Sarvam AI STT fallback error. Trying Groq Whisper Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 6: Groq Whisper Cloud (Ultimate Fallback when all tokens exhausted)
    // -------------------------------------------------------------
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const safeAudioFile = new File(
          [new Uint8Array(audioBuffer)],
          file.name || "interview_answer.webm",
          { type: file.type || "audio/webm" }
        );

        let whisperRes;
        try {
          whisperRes = await groq.audio.transcriptions.create({
            file: safeAudioFile,
            model: "whisper-large-v3-turbo",
            language: "en",
            response_format: "json",
            temperature: 0.1,
            prompt:
              "Technical software engineering interview answer covering Java, OOP, DBMS, SQL, Operating Systems, Computer Networks, REST APIs, Security, Git, Testing, Linux, LLD, HLD, AI/ML engineering, transformers, and algorithms.",
          });
        } catch (turboErr: any) {
          console.warn("Groq whisper-large-v3-turbo failed, falling back to whisper-large-v3:", turboErr.message || turboErr);
          whisperRes = await groq.audio.transcriptions.create({
            file: safeAudioFile,
            model: "whisper-large-v3",
            language: "en",
            response_format: "json",
            temperature: 0.1,
          });
        }

        const rawWhisperText = (whisperRes?.text || "").trim();
        if (rawWhisperText) {
          const englishText = await ensureEnglishTranscript(rawWhisperText, groqKey);
          return NextResponse.json({
            success: true,
            text: englishText,
            provider: "groq-whisper-fallback",
          });
        }
      } catch (err: any) {
        console.error("Groq Whisper STT fallback error:", err.message || err);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "All transcription providers (AssemblyAI Primary & Secondary, Speechmatics, Gladia, Sarvam AI, and Whisper) failed to transcribe audio. Please check your microphone and speak clearly.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Transcription endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process audio transcription.",
      },
      { status: 500 }
    );
  }
}
