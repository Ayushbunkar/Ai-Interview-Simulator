import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "GROQ_API_KEY is not configured for Whisper speech-to-text.",
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
      language: "en",
      temperature: 0.2,
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
