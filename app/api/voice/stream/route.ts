import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DifficultyLevel } from "@/lib/progress";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

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
    const {
      audio,
      learningLanguage,
      nativeLanguage,
      difficulty,
      conversationContext = [],
    } = body;

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
    // In Node.js 18+, File is available globally
    const audioFile = new File([audioBuffer], "audio.webm", {
      type: "audio/webm",
    });

    // Use Whisper API for transcription
    // Note: OpenAI Realtime API requires WebSocket, which is better suited for client-side connections
    // For server-side, we'll use Whisper API which is simpler for this use case
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: learningLanguage === "en" ? "en" : learningLanguage === "it" ? "it" : undefined,
    });

    const transcribedText = transcription.text;

    if (!transcribedText || !transcribedText.trim()) {
      return NextResponse.json(
        { error: "Could not transcribe audio" },
        { status: 400 }
      );
    }

    // Return only transcription - evaluation will be handled by handleSend
    // This prevents duplicate evaluation calls
    return NextResponse.json({
      transcription: transcribedText,
    });
  } catch (error) {
    console.error("Voice stream API error:", error);
    return NextResponse.json(
      { error: "Failed to process voice input" },
      { status: 500 }
    );
  }
}

