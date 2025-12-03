import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DifficultyLevel } from "@/lib/progress";
import { buildEvaluationPrompt } from "@/lib/prompts";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

interface EvaluateRequest {
  userMessage: string;
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
    const body: EvaluateRequest = await request.json();
    const { userMessage, learningLanguage, nativeLanguage, difficulty, conversationContext = [] } = body;

    // Build the evaluation prompt
    const evaluationPrompt = buildEvaluationPrompt({
      userMessage,
      learningLanguage,
      nativeLanguage,
      difficulty,
      conversationContext,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: evaluationPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 200,
      temperature: 0.3, // Lower temperature for more consistent evaluation
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // Parse the response
    let needsCorrection = false;
    let correction: string | undefined;
    let errors: string[] = [];

    if (responseText.trim().toUpperCase().startsWith("CORRECTION:")) {
      needsCorrection = true;
      correction = responseText.replace(/^CORRECTION:\s*/i, "").trim();
      // Extract individual errors if mentioned
      const errorMatches = correction.match(/(?:error|issue|problem):\s*([^\.]+)/gi);
      if (errorMatches) {
        errors = errorMatches.map(m => m.replace(/^(?:error|issue|problem):\s*/i, "").trim());
      }
    } else if (responseText.trim().toUpperCase().startsWith("OK:")) {
      needsCorrection = false;
    } else {
      // If response doesn't match expected format, assume no correction needed
      // (better to not show false corrections)
      needsCorrection = false;
    }

    return NextResponse.json({
      needsCorrection,
      correction,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Evaluation API error:", error);
    // On error, return no correction needed to avoid blocking conversation
    return NextResponse.json({
      needsCorrection: false,
    });
  }
}

