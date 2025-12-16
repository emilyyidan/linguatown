import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { DifficultyLevel } from "@/lib/progress";
import { getTurnLimits, buildSystemPrompt, buildHintPrompt } from "@/lib/prompts";

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
  nativeLanguage?: string;
  learningLanguage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, characterName, role, location, turnCount, difficulty, topic, nativeLanguage = "en", learningLanguage = "en" } = body;

    const { min: MIN_TURNS, max: MAX_TURNS } = getTurnLimits(difficulty);
    const canEnd = turnCount >= MIN_TURNS;
    const mustEnd = turnCount >= MAX_TURNS;
    
    // Debug logging for beginner level
    if (difficulty === "beginner") {
      console.log(`[BEGINNER TURN] turnCount: ${turnCount}, canEnd: ${canEnd}, mustEnd: ${mustEnd}, min: ${MIN_TURNS}, max: ${MAX_TURNS}`);
    }

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
      nativeLanguage,
      learningLanguage,
    });

    const openai = getOpenAIClient();
    
    // First call: Get the character's message
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

    const completionId = completion.id;
    const finishReason = completion.choices[0]?.finish_reason;
    const rawResponseText = completion.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you say that again?";
    let responseText = rawResponseText;
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

    // Second call: Generate hint if needed (for beginner/intermediate, when not ending)
    let hint: string | undefined;
    if (difficulty !== "advanced" && !mustEnd && !shouldEnd) {
      // Only generate hint if conversation is continuing (not ending)
      try {
        const hintPrompt = buildHintPrompt({
          characterMessage: responseText,
          learningLanguage,
          nativeLanguage,
          difficulty,
          conversationContext: messages.slice(-5).map((msg) => ({
            role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
            content: msg.content,
          })),
        });

        const hintCompletion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: hintPrompt },
            { role: "user", content: "Generate the hint." },
          ],
          max_tokens: 100,
          temperature: 0.7,
        });

        hint = hintCompletion.choices[0]?.message?.content?.trim();
        
        if (!hint) {
          console.warn("[HINT GENERATION FAILED] OpenAI ID:", completionId, {
            difficulty,
            turnCount,
            characterMessage: responseText,
          });
        }
      } catch (error) {
        console.error("Error generating hint:", error);
        // Don't block the response if hint generation fails
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
