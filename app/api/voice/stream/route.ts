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
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[Voice API ${requestId}] Request received at ${new Date().toISOString()}`);
    
    const body: VoiceStreamRequest = await request.json();
    const {
      audio,
      learningLanguage,
      nativeLanguage,
      difficulty,
      conversationContext = [],
    } = body;

    const audioSize = audio ? Buffer.byteLength(audio, "base64") : 0;
    console.log(`[Voice API ${requestId}] Request params:`, {
      learningLanguage,
      nativeLanguage,
      difficulty,
      audioSizeBytes: audioSize,
      audioSizeKB: Math.round(audioSize / 1024),
      conversationContextLength: conversationContext.length,
    });

    if (!audio) {
      console.error(`[Voice API ${requestId}] Error: No audio data provided`);
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, "base64");
    console.log(`[Voice API ${requestId}] Audio buffer created: ${audioBuffer.length} bytes`);

    // Create a File object for OpenAI API
    // In Node.js 18+, File is available globally
    const audioFile = new File([audioBuffer], "audio.webm", {
      type: "audio/webm",
    });

    // Use Whisper API for transcription
    // Note: OpenAI Realtime API requires WebSocket, which is better suited for client-side connections
    // For server-side, we'll use Whisper API which is simpler for this use case
    const whisperLanguage = learningLanguage === "en" ? "en" : learningLanguage === "it" ? "it" : undefined;
    console.log(`[Voice API ${requestId}] Calling OpenAI Whisper API with language: ${whisperLanguage || "auto"}`);
    const whisperStartTime = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: whisperLanguage,
    });

    const whisperDuration = Date.now() - whisperStartTime;
    console.log(`[Voice API ${requestId}] OpenAI Whisper API completed in ${whisperDuration}ms`);

    const transcribedText = transcription.text;
    console.log(`[Voice API ${requestId}] Transcription result:`, {
      text: transcribedText,
      textLength: transcribedText?.length || 0,
    });

    if (!transcribedText || !transcribedText.trim()) {
      console.error(`[Voice API ${requestId}] Error: Empty transcription result`);
      return NextResponse.json(
        { error: "Could not transcribe audio" },
        { status: 400 }
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[Voice API ${requestId}] Request completed successfully in ${totalDuration}ms`);

    // Return only transcription - evaluation will be handled by handleSend
    // This prevents duplicate evaluation calls
    return NextResponse.json({
      transcription: transcribedText,
    });
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[Voice API ${requestId}] Error after ${totalDuration}ms:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { error: "Failed to process voice input" },
      { status: 500 }
    );
  }
}
