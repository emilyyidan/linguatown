import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DifficultyLevel } from "@/lib/progress";
import { getTurnLimits, buildSystemPrompt } from "@/lib/prompts";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  characterName: string;
  role: string;
  location: string;
  turnCount: number;
  difficulty: DifficultyLevel;
  topic?: {
    id: string;
    name: string;
    description: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, characterName, role, location, turnCount, difficulty, topic } = body;

    const { min: MIN_TURNS, max: MAX_TURNS } = getTurnLimits(difficulty);
    const canEnd = turnCount >= MIN_TURNS;
    const mustEnd = turnCount >= MAX_TURNS;

    // Build the system prompt using the prompts module
    const systemPrompt = buildSystemPrompt({
      characterName,
      role,
      location,
      difficulty,
      topic,
      turnCount,
      canEnd,
      mustEnd,
    });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    let responseText = completion.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you say that again?";
    let shouldEnd = mustEnd;

    // Parse the [CONTINUE] or [END] tag if present
    if (canEnd && !mustEnd) {
      if (responseText.startsWith("[END]")) {
        shouldEnd = true;
        responseText = responseText.replace("[END]", "").trim();
      } else if (responseText.startsWith("[CONTINUE]")) {
        shouldEnd = false;
        responseText = responseText.replace("[CONTINUE]", "").trim();
      }
    }

    // Parse hint from response (for beginner and intermediate only)
    let hint: string | undefined;
    if (difficulty !== "advanced") {
      const hintMatch = responseText.match(/HINT:\s*(.+?)(?:\n|$)/i);
      if (hintMatch) {
        hint = hintMatch[1].trim();
        // Remove hint from response text
        responseText = responseText.replace(/HINT:\s*.+?(?:\n|$)/i, "").trim();
      }
    }

    // Generate topic guidance for first message only
    let topicGuidance: string | undefined;
    if (turnCount === 0 && topic) {
      // Generate a natural description of what the user will practice
      topicGuidance = `Practice: ${topic.description}`;
    }

    return NextResponse.json({ 
      message: responseText,
      shouldEnd,
      topicGuidance,
      hint,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
