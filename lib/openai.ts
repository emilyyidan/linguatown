import OpenAI from "openai";

/**
 * Get an OpenAI client instance
 * Throws an error if OPENAI_API_KEY is not configured
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

