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

    let openai;
    try {
      openai = getOpenAIClient();
    } catch (clientError) {
      const errorMsg = clientError instanceof Error ? clientError.message : String(clientError);
      console.error(`[Voice API ${requestId}] Failed to get OpenAI client:`, errorMsg);
      return NextResponse.json(
        { error: "OpenAI client configuration error" },
        { status: 500 }
      );
    }

    // Convert base64 audio to buffer
    let audioBuffer: Buffer;
    try {
      audioBuffer = Buffer.from(audio, "base64");
      console.log(`[Voice API ${requestId}] Audio buffer created: ${audioBuffer.length} bytes`);
    } catch (bufferError) {
      const errorMsg = bufferError instanceof Error ? bufferError.message : String(bufferError);
      console.error(`[Voice API ${requestId}] Failed to create audio buffer:`, errorMsg);
      return NextResponse.json(
        { error: "Invalid audio data format" },
        { status: 400 }
      );
    }

    // Create a File object for OpenAI API
    // In Node.js 18+, File is available globally
    let audioFile: File;
    try {
      // Check if File is available
      if (typeof File === "undefined") {
        throw new Error("File API is not available in this environment");
      }
      // Convert Buffer to Uint8Array for File constructor compatibility
      const audioArray = new Uint8Array(audioBuffer);
      audioFile = new File([audioArray], "audio.webm", {
        type: "audio/webm",
      });
      console.log(`[Voice API ${requestId}] Audio file created:`, {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
      });
    } catch (fileError) {
      const errorMsg = fileError instanceof Error ? fileError.message : String(fileError);
      console.error(`[Voice API ${requestId}] Failed to create audio file:`, errorMsg);
      return NextResponse.json(
        { error: `Failed to process audio file: ${errorMsg}` },
        { status: 500 }
      );
    }

    // Use Whisper API for transcription
    // Note: OpenAI Realtime API requires WebSocket, which is better suited for client-side connections
    // For server-side, we'll use Whisper API which is simpler for this use case
    const whisperLanguage = learningLanguage === "en" ? "en" : learningLanguage === "it" ? "it" : undefined;
    console.log(`[Voice API ${requestId}] Calling OpenAI Whisper API with language: ${whisperLanguage || "auto"}`);
    const whisperStartTime = Date.now();
    
    let transcription;
    try {
      transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: whisperLanguage,
      });
    } catch (openaiError: any) {
      const errorMsg = openaiError instanceof Error ? openaiError.message : String(openaiError);
      const errorStatus = openaiError?.status || openaiError?.response?.status;
      const errorCode = openaiError?.code || openaiError?.response?.data?.error?.code;
      
      console.error(`[Voice API ${requestId}] OpenAI API error:`, {
        error: errorMsg,
        status: errorStatus,
        code: errorCode,
        type: openaiError?.type,
      });
      
      // Return more specific error based on OpenAI error
      if (errorStatus === 401 || errorCode === "invalid_api_key") {
        return NextResponse.json(
          { error: "OpenAI API authentication failed" },
          { status: 500 }
        );
      } else if (errorStatus === 429 || errorCode === "rate_limit_exceeded") {
        return NextResponse.json(
          { error: "OpenAI API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      } else if (errorStatus === 413 || errorMsg.includes("file size")) {
        return NextResponse.json(
          { error: "Audio file is too large" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `OpenAI transcription error: ${errorMsg}` },
          { status: 500 }
        );
      }
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[Voice API ${requestId}] Error after ${totalDuration}ms:`, {
      error: errorMessage,
      name: errorName,
      stack: errorStack,
    });
    
    // Return more detailed error information
    // In production, we still want to log the full error but return a user-friendly message
    const isDevelopment = process.env.NODE_ENV === "development";
    
    return NextResponse.json(
      { 
        error: "Failed to process voice input",
        // Include more details in development or for certain error types
        ...(isDevelopment && {
          details: errorMessage,
          errorName,
        }),
      },
      { status: 500 }
    );
  }
}
