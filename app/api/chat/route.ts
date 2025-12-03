import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

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

// Turn limits vary by difficulty level
function getTurnLimits(difficulty: DifficultyLevel): { min: number; max: number } {
  switch (difficulty) {
    case "beginner":
      return { min: 2, max: 3 }; // Short, focused conversations
    case "intermediate":
      return { min: 3, max: 5 }; // Moderate length
    case "advanced":
      return { min: 4, max: 7 }; // Longer, more in-depth discussions
  }
}

// Location-specific scenarios for each difficulty level
const locationScenarios: Record<string, Record<DifficultyLevel, string>> = {
  "Restaurant": {
    beginner: `SCENARIO: Simple ordering
- Help them order a meal (drink, main course, maybe dessert)
- Ask simple questions: "What would you like?" "Anything to drink?"
- Keep it to basic menu items or simple choice questions`,
    intermediate: `SCENARIO: Special occasion dinner
- They're planning a birthday dinner or anniversary meal
- Ask about the occasion, dietary restrictions, preferences
- Discuss recommendations, specials, wine pairings
- Encourage them to describe what they're celebrating and who's coming`,
    advanced: `SCENARIO: Food critic or culinary discussion
- Treat them as a food enthusiast 
- Discuss ingredient sourcing, chef's inspiration
- Ask about their own cooking experiences and favorite cuisines
- Encourage them to share opinions and detailed preferences`,
  },
  "Bakery": {
    beginner: `SCENARIO: Simple purchase
- Help them choose what to buy including how many of various items.
- Create realistic scenarios such as an item being out of stock or needing to wait for it to be done baking
- Ask basic questions: "What can I get you?" "For here or to go?"
- Suggest popular items, handle straightforward transactions`,
    intermediate: `SCENARIO: Party catering order
- They need baked goods for an event (birthday, office party, gathering)
- Ask about the occasion, number of guests, preferences
- Discuss customization options (flavors, decorations, dietary needs)
- Encourage them to describe the party and what would make it special`,
    advanced: `SCENARIO: Baking class or technique discussion
- They're interested in learning to bake or discussing techniques
- Talk about recipes, methods, common mistakes, pro tips
- Ask about their baking experience and what they want to learn
- Encourage them to share their baking attempts and questions`,
  },
  "School": {
    beginner: `SCENARIO: New student orientation
- Help them find their classroom or understand the schedule
- Ask simple questions about what class they're looking for
- Give basic directions and information`,
    intermediate: `SCENARIO: Parent-teacher meeting or course selection
- Discuss academic progress, extracurriculars, or choosing classes
- Ask about interests, goals, concerns
- Encourage them to describe their child's interests or their own academic goals`,
    advanced: `SCENARIO: Discuss how much technology should be used in the classroom
- Discuss teaching methods, learning styles, educational trends
- Ask about their experiences with different approaches to learning
- Encourage them to share their views on education and what works for them`,
  },
  "Bank": {
    beginner: `SCENARIO: Basic banking transaction
- Help with simple tasks: checking balance, making a deposit, getting cash
- Ask straightforward questions about what they need
- Keep it to routine banking services`,
    intermediate: `SCENARIO: Opening an account or loan inquiry
- Discuss different account types, savings goals, or loan options
- Ask about their financial goals and situation
- Encourage them to describe what they're saving for or planning`,
    advanced: `SCENARIO: Investment or financial planning discussion
- Discuss investment strategies, retirement planning, financial goals
- Ask about their risk tolerance, timeline, existing portfolio
- Encourage them to share their financial philosophy and long-term plans`,
  },
  "Hotel": {
    beginner: `SCENARIO: Simple check-in
- Help them check into their room
- Ask basic questions: name, reservation, room preference
- Provide key information about the stay`,
    intermediate: `SCENARIO: Planning a special trip
- They're booking for a honeymoon, anniversary, or family vacation
- Ask about the occasion, preferences, special requests
- Discuss amenities, local attractions, dining options
- Encourage them to describe their ideal trip and what they want to experience`,
    advanced: `SCENARIO: Travel expert
- Treat them as an experienced traveler
- Discuss travel tips, hidden gems, cultural experiences
- Ask about their most memorable trips and travel philosophy
- Encourage them to share stories and recommendations`,
  },
  "Grocery Store": {
    beginner: `SCENARIO: Finding items
- Help them locate products in the store
- Ask simple questions about what they're looking for
- Give basic directions and suggestions`,
    intermediate: `SCENARIO: Meal planning assistance
- They're shopping for a dinner party or special meal
- Ask about the menu, number of guests, dietary restrictions
- Suggest ingredients, quantities, alternatives
- Encourage them to describe what they're cooking and for whom`,
    advanced: `SCENARIO: Culinary or nutrition discussion
- Discuss ingredients, seasonal produce, cooking techniques
- Ask about their cooking style and dietary philosophy
- Encourage them to share recipes, nutrition goals, food experiences`,
  },
};

function getScenarioPrompt(location: string, difficulty: DifficultyLevel): string {
  const scenarios = locationScenarios[location];
  if (scenarios) {
    return scenarios[difficulty];
  }
  // Fallback for unknown locations
  return difficulty === "beginner" 
    ? "SCENARIO: Simple transaction or request"
    : difficulty === "intermediate"
    ? "SCENARIO: More detailed planning or discussion"
    : "SCENARIO: Expert-level discussion sharing experiences";
}

function getDifficultyGuidelines(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case "beginner":
      return `CONVERSATION STYLE:
- Use simple, clear language
- Offer variety between direct questions, and offering information and letting the user direct the conversation.
- If asking a question, only ask one. Do not include multiple questions in one turn.
- Keep your responses short (1 sentence)
- Focus on the immediate task
- Be patient and encouraging`;
    
    case "intermediate":
      return `CONVERSATION STYLE:
- Use natural, conversational language
- Ask open-ended questions that invite descriptions
- Encourage them to explain their preferences and reasons
- Show interest in details they share
- Build on their responses to go deeper`;
    
    case "advanced":
      return `CONVERSATION STYLE:
- Engage as equals having a genuine conversation
- Ask thought-provoking questions about their experiences
- Invite them to share stories, opinions, and expertise
- Respond to their ideas with your own insights
- Create a back-and-forth discussion, not just Q&A`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, characterName, role, location, turnCount, difficulty, topic } = body;

    const { min: MIN_TURNS, max: MAX_TURNS } = getTurnLimits(difficulty);
    const canEnd = turnCount >= MIN_TURNS;
    const mustEnd = turnCount >= MAX_TURNS;
    const styleGuidelines = getDifficultyGuidelines(difficulty);
    
    // Use specific topic if provided, otherwise fall back to generic scenario
    const topicPrompt = topic 
      ? `CONVERSATION TOPIC: ${topic.name}
${topic.description}

You should initiate this conversation naturally. Start by greeting the customer and then guide the conversation toward this topic. Make it feel natural and contextual to your role as a ${role} at the ${location}.`
      : getScenarioPrompt(location, difficulty);

    let systemPrompt: string;

    if (mustEnd) {
      const closingGuidance = difficulty === "beginner"
        ? "Keep it very brief and simple (1 sentence). Thank them warmly."
        : difficulty === "intermediate"
        ? "Thank them warmly and reference something specific from the conversation. Keep it brief (1-2 sentences)."
        : "Thank them warmly and reference something meaningful from your discussion. You can be slightly more elaborate (2-3 sentences) given the depth of conversation.";

      systemPrompt = `You are ${characterName}, a friendly ${role} at the ${location}.

This is the END of the conversation. Wrap up naturally based on what was discussed.
${closingGuidance}

Respond with ONLY your closing message.`;
    } else if (canEnd) {
      const endGuidance = difficulty === "beginner" 
        ? "Since this is a beginner conversation, wrap up soon unless there's a critical detail to cover. Keep it brief and friendly."
        : difficulty === "intermediate"
        ? "Based on how the conversation has flowed, decide whether to continue or wrap up naturally."
        : "You can continue exploring this topic in depth. Only wrap up when the conversation has reached a natural, satisfying conclusion.";

      systemPrompt = `You are ${characterName}, a friendly ${role} at the ${location}.

${topicPrompt}

${styleGuidelines}

${endGuidance}

IMPORTANT: Start your response with [CONTINUE] or [END], then your message.
If ending, give a warm, natural goodbye that references the conversation.`;
    } else {
      systemPrompt = `You are ${characterName}, a friendly ${role} at the ${location}.

${topicPrompt}

${styleGuidelines}

Guidelines:
- Stay in character naturally
- Keep responses concise but warm
- Move the conversation forward
- Don't be overly formal or verbose`;
    }

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
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
