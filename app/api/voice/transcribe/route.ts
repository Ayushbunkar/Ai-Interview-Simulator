import { NextRequest, NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import Groq from "groq-sdk";
import { getAssemblyAIKeys, getActiveGroqKey } from "@/lib/config/cloud-fallback";

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
          return NextResponse.json({
            success: true,
            text: transcript.text.trim(),
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
          return NextResponse.json({
            success: true,
            text: transcript.text.trim(),
            provider: "assemblyai-secondary",
            confidence: transcript.confidence,
          });
        } else if (transcript.status === "error") {
          throw new Error(transcript.error || "AssemblyAI Secondary returned error status.");
        }
      } catch (err: any) {
        console.warn("AssemblyAI Secondary STT failed. Trying Groq Whisper Fallback:", err.message || err);
      }
    }

    // -------------------------------------------------------------
    // TIER 3: Groq Whisper Cloud Fallback (whisper-large-v3-turbo)
    // -------------------------------------------------------------
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const whisperRes = await groq.audio.transcriptions.create({
          file,
          model: "whisper-large-v3-turbo",
          response_format: "json",
          temperature: 0.2,
          prompt:
            "Technical software engineering interview answer covering Java, OOP, DBMS, SQL, Operating Systems, Computer Networks, REST APIs, System Design, LLD, HLD, AI/ML engineering, transformers, and algorithms.",
        });

        const text = (whisperRes.text || "").trim();
        if (text) {
          return NextResponse.json({
            success: true,
            text,
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
        error: "All transcription providers (AssemblyAI Primary, Secondary, and Whisper) failed to transcribe audio. Please check your microphone and speak clearly.",
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
