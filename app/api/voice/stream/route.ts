export const runtime = "nodejs";
export const maxDuration = 30;
import { NextRequest, NextResponse } from "next/server";
import { DifficultyLevel } from "@/lib/progress";
import { getOpenAIClient } from "@/lib/openai";

interface VoiceStreamRequest {
  audio: string; // Base64 encoded audio
  learningLanguage: string;
  nativeLanguage: string;
  difficulty: DifficultyLevel;
  conversationContext?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceStreamRequest = await request.json();
    const { audio, learningLanguage } = body;

    if (!audio) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    // Create a File object for OpenAI API
    const audioArray = new Uint8Array(audioBuffer);
    const audioFile = new File([audioArray], "audio.webm", {
      type: "audio/webm",
    });

    // Use Whisper API for transcription
    const whisperLanguage = learningLanguage === "en" ? "en" : learningLanguage === "it" ? "it" : undefined;
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: whisperLanguage,
    });

    const transcribedText = transcription.text;

    if (!transcribedText || !transcribedText.trim()) {
      return NextResponse.json(
        { error: "Could not transcribe audio" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      transcription: transcribedText,
    });
  } catch (error) {
    console.error("Voice stream API error:", error);
    
    // Handle specific OpenAI errors
    const err = error as any;
    if (err?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to process voice input" },
      { status: 500 }
    );
  }
}
