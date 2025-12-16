import { DifficultyLevel } from "./progress";

/**
 * Conversation context type for passing recent messages to prompts
 */
export type ConversationContext = Array<{
  role: "user" | "assistant";
  content: string;
}>;

/**
 * Number of messages to include in conversation context for API calls
 */
export const CONVERSATION_CONTEXT_SIZE = 5;

/**
 * Number of messages to include in recent context summaries within prompts
 */
export const RECENT_CONTEXT_SIZE = 3;

/**
 * Turn limits vary by difficulty level
 */
export function getTurnLimits(difficulty: DifficultyLevel): { min: number; max: number } {
  switch (difficulty) {
    case "beginner":
      // Beginner: LLM speaks 4 times (opening + 3 responses), user speaks 3 times
      // After 3 user messages (turnCount = 3), LLM sends final wrap-up (no questions, no hint)
      return { min: 2, max: 3 };
    case "intermediate":
      return { min: 3, max: 4 }; // Moderate length
    case "advanced":
      return { min: 3, max: 5 }; // Longer, more in-depth discussions
  }
}

/**
 * Location-specific scenarios for each difficulty level
 */
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

/**
 * Get scenario prompt for a location and difficulty level
 */
export function getScenarioPrompt(location: string, difficulty: DifficultyLevel): string {
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

/**
 * Get conversation style guidelines based on difficulty level
 */
export function getDifficultyGuidelines(difficulty: DifficultyLevel): string {
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
- Use natural, conversational language. Keep your dialogue short.
- Ask open-ended questions that invite descriptions
- If asking a question, only ask one. Do not include multiple questions in one turn.
- Encourage them to explain their preferences and reasons
- Show interest in details they share
- Build on their responses to go deeper`;
    
    case "advanced":
      return `CONVERSATION STYLE:
- Engage as equals having a genuine conversation. Keep your dialogue short.
- Ask thought-provoking questions about their experiences
- If asking a question, only ask one. Do not include multiple questions in one turn.
- Invite them to share stories, opinions, and expertise
- Respond to their ideas with your own insights
- Create a back-and-forth discussion, not just Q&A`;
  }
}

/**
 * Map language codes to full names
 */
function getLanguageName(languageCode: string): string {
  const languageNames: Record<string, string> = {
    en: "English",
    it: "Italian",
    es: "Spanish",
    fr: "French",
    de: "German",
  };
  return languageNames[languageCode] || languageCode;
}

/**
 * Parameters for building a system prompt
 */
export interface BuildPromptParams {
  characterName: string;
  role: string;
  location: string;
  difficulty: DifficultyLevel;
  topic?: {
    id: string;
    name: string;
    description: string;
  };
  turnCount: number;
  canEnd: boolean;
  mustEnd: boolean;
  nativeLanguage?: string;
  learningLanguage?: string;
}

/**
 * Build the complete system prompt for the LLM based on conversation state
 */
export function buildSystemPrompt(params: BuildPromptParams): string {
  const { characterName, role, location, difficulty, topic, canEnd, mustEnd, nativeLanguage = "en", learningLanguage = "en" } = params;
  
  const styleGuidelines = getDifficultyGuidelines(difficulty);
  const learningLanguageName = getLanguageName(learningLanguage);
  const nativeLanguageName = getLanguageName(nativeLanguage);
  
  // Language instruction for conversation
  const languageInstruction = learningLanguage !== "en"
    ? `\nLANGUAGE REQUIREMENT:
You must respond ONLY in ${learningLanguageName}. The user's native language is ${nativeLanguageName}, but you should conduct this entire conversation in ${learningLanguageName}. Do not switch to ${nativeLanguageName} or any other language.`
    : "";
  
  // Use specific topic if provided, otherwise fall back to generic scenario
  const topicPrompt = topic 
    ? `CONVERSATION TOPIC: ${topic.name}
${topic.description}

You should initiate this conversation naturally. Start by greeting the user and then guide the conversation toward this topic. Make it feel natural and contextual to your role as a ${role} at the ${location}.`
    : getScenarioPrompt(location, difficulty);

  if (mustEnd) {
    const closingGuidance = difficulty === "beginner"
      ? `⚠️ CRITICAL: This is the FINAL message of the conversation. You MUST:
1. Wrap up the conversation naturally
2. Do NOT ask any questions - this is a closing statement, not a question
3. Do NOT include any hints`
      : difficulty === "intermediate"
      ? "Thank them warmly and reference something specific from the conversation. Keep it brief (1-2 sentences)."
      : "Thank them warmly and reference something meaningful from your discussion. You can be slightly more elaborate (2-3 sentences) given the depth of conversation.";

    return `You are ${characterName}, a friendly ${role} at the ${location}.
${languageInstruction}

⚠️ THIS IS THE END OF THE CONVERSATION - FINAL MESSAGE REQUIRED ⚠️
${closingGuidance}

CRITICAL RULES FOR THIS FINAL MESSAGE:
- Do NOT ask any questions
- Do NOT include hints
- Do NOT use [CONTINUE] or [END] tags
- Simply provide a warm closing statement

Respond with ONLY your closing message.`;
  } else if (canEnd) {
    const endGuidance = difficulty === "beginner" 
      ? `The user will respond after your message. You can choose to continue the conversation or signal that it's coming to an end. If the conversation feels complete, you can use [END] to indicate that. Keep responses brief and friendly.`
      : difficulty === "intermediate"
      ? "Based on how the conversation has flowed, decide whether to continue or wrap up naturally."
      : "You can continue exploring this topic.";

    return `You are ${characterName}, a friendly ${role} at the ${location}.
${languageInstruction}

${topicPrompt}

${styleGuidelines}

${endGuidance}

RESPONSE FORMAT:
Start your response with [CONTINUE] or [END], then write your message in ${learningLanguageName}.

Example:
[CONTINUE] Perfetto! Vuoi pagare con contante o carta di credito?

or

[END] Grazie mille! È stato un piacere aiutarti.`;
  } else {
    return `You are ${characterName}, a friendly ${role} at the ${location}.
${languageInstruction}

${topicPrompt}

${styleGuidelines}

Guidelines:
- Stay in character naturally
- Keep responses concise but warm
- Move the conversation forward
- Don't be overly formal or verbose

Write your message in ${learningLanguageName}.`;
  }
}

/**
 * Parameters for building a hint generation prompt
 */
export interface BuildHintPromptParams {
  characterMessage: string;
  learningLanguage: string;
  nativeLanguage: string;
  difficulty: DifficultyLevel;
  conversationContext?: ConversationContext;
}

/**
 * Build the prompt for generating a hint based on the character's message
 */
export function buildHintPrompt(params: BuildHintPromptParams): string {
  const { characterMessage, learningLanguage, nativeLanguage, difficulty, conversationContext = [] } = params;
  
  const learningLanguageName = getLanguageName(learningLanguage);
  const nativeLanguageName = getLanguageName(nativeLanguage);
  
  // Build context summary if available
  let contextSummary = "";
  if (conversationContext.length > 0) {
    const recentContext = conversationContext.slice(-RECENT_CONTEXT_SIZE);
    contextSummary = `\n\nCONVERSATION CONTEXT:\n${recentContext.map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")}`;
  }

  return `You are a language learning assistant. A character just said this to a student learning ${learningLanguageName}:

CHARACTER'S MESSAGE:
${characterMessage}

${contextSummary}

Generate a helpful hint in ${nativeLanguageName} (the student's native language) about what the student could say in response. 

The hint should be:
- Written entirely in ${nativeLanguageName}
- Guidance/instructions only, NOT an example phrase in ${learningLanguageName}
- Brief and clear (under 20 words)
- Appropriate for ${difficulty} level

Provide ONLY the hint text, nothing else. Do not include "HINT:" prefix or any other formatting.`;
}

/**
 * Parameters for building an evaluation prompt
 */
export interface BuildEvaluationPromptParams {
  userMessage: string;
  learningLanguage: string;
  nativeLanguage: string;
  difficulty: DifficultyLevel;
  conversationContext?: ConversationContext;
}

/**
 * Build the evaluation prompt for checking user input errors
 */
export function buildEvaluationPrompt(params: BuildEvaluationPromptParams): string {
  const { userMessage, learningLanguage, nativeLanguage, difficulty, conversationContext = [] } = params;
  
  const learningLanguageName = getLanguageName(learningLanguage);
  const nativeLanguageName = getLanguageName(nativeLanguage);
  
  // Build context summary if available
  let contextSummary = "";
  if (conversationContext.length > 0) {
    const recentContext = conversationContext.slice(-RECENT_CONTEXT_SIZE);
    contextSummary = `\n\nCONVERSATION CONTEXT:\n${recentContext.map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")}`;
  }

  return `You are a language learning assistant evaluating a student's input. The student's native language is ${nativeLanguageName}, and they are learning ${learningLanguageName}.

Your task is to evaluate the user's message for errors. Check for:
1. Grammar errors in ${learningLanguageName}
2. Vocabulary errors (wrong word usage, incorrect word choice)
3. Language mixing (words from ${nativeLanguageName} or other languages when they should be using ${learningLanguageName})
4. Comprehensibility issues (sentences that don't make sense or are unclear)

DIFFICULTY LEVEL: ${difficulty}
- For beginner level, be more lenient - only flag major errors
- For intermediate level, flag moderate to major errors
- For advanced level, flag even minor errors

${contextSummary}

IMPORTANT INSTRUCTIONS:
- If the message has NO ERRORS or only very minor issues that don't affect comprehensibility, respond with: OK: The message is correct.
- If the message has ERRORS, respond with: CORRECTION: [ONLY provide the correction itself in ${nativeLanguageName}. Do NOT include phrases like "there are mistakes here", "keep practicing", or any other accessory messages. Just provide the correction directly.]

Examples:
- User writes in ${nativeLanguageName} when they should use ${learningLanguageName}: CORRECTION: Try saying this in ${learningLanguageName}: [correction]
- Grammar error: CORRECTION: Instead of "[wrong]", use "[correct]". The correct form is: [full corrected sentence]
- Vocabulary error: CORRECTION: Use "[correct word]" instead of "[wrong word]". Try: [full corrected sentence]

Be concise (under 100 characters). Provide ONLY the correction, no extra commentary.`;
}

/**
 * Map UI messages to conversation context format for API calls
 * @param messages Array of messages with sender field ("user" | "character")
 * @param limit Optional limit on number of messages to include (defaults to CONVERSATION_CONTEXT_SIZE)
 * @returns Conversation context array with last N messages
 */
export function mapMessagesToConversationContext(
  messages: Array<{ sender: "user" | "character"; text: string }>,
  limit: number = CONVERSATION_CONTEXT_SIZE
): ConversationContext {
  return messages.slice(-limit).map((msg) => ({
    role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
    content: msg.text,
  }));
}

