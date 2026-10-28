import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getActiveGroqKey } from "@/lib/config/cloud-fallback";

export async function POST(request: NextRequest) {
  try {
    const apiKey = getActiveGroqKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Speech-to-text API is not configured. Please use 'Live Mic (Browser)' or type your answer.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No audio file provided in request." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    // Call Groq Whisper API (whisper-large-v3-turbo is state-of-the-art and takes < 300ms)
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      temperature: 0.2,
      prompt:
        "Technical software engineering interview answer covering programming languages, algorithms, data structures, Big-O notation, system design, databases, and computer science.",
    });

    const text = (transcription.text || "").trim();

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error: any) {
    console.error("Whisper audio transcription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to transcribe audio with Whisper.",
      },
      { status: 500 }
    );
  }
}
