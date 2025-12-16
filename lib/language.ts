import { Language } from "./characters";

// Re-export Language type for convenience
export type { Language };

const NATIVE_LANGUAGE_KEY = "lingua-town-native-language";
const LEARNING_LANGUAGE_KEY = "lingua-town-learning-language";

/**
 * Get the user's native language
 * Currently always returns "en" (English), but architecture supports future changes
 */
export function getNativeLanguage(): Language {
  if (typeof window === "undefined") return "en";
  
  try {
    const stored = localStorage.getItem(NATIVE_LANGUAGE_KEY);
    return (stored as Language) || "en";
  } catch {
    return "en";
  }
}

/**
 * Get the current learning language
 * Defaults to "en" if not set
 */
export function getLearningLanguage(): Language {
  if (typeof window === "undefined") return "en";
  
  try {
    const stored = localStorage.getItem(LEARNING_LANGUAGE_KEY);
    return (stored as Language) || "en";
  } catch {
    return "en";
  }
}

/**
 * Set the current learning language
 */
export function setLearningLanguage(language: Language): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(LEARNING_LANGUAGE_KEY, language);
  } catch (error) {
    console.error("Failed to save learning language:", error);
  }
}

/**
 * Get available learning languages
 */
export function getAvailableLearningLanguages(): Language[] {
  return ["en", "it"];
}

/**
 * Get display name for a language
 */
export function getLanguageDisplayName(language: Language): string {
  const names: Record<Language, string> = {
    en: "English",
    it: "Italian",
    es: "Spanish",
    fr: "French",
    de: "German",
  };
  return names[language] || language;
}

/**
 * Get flag emoji for a language
 */
export function getLanguageFlag(language: Language): string {
  const flags: Record<Language, string> = {
    en: "🇬🇧",
    it: "🇮🇹",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
  };
  return flags[language] || "🌐";
}



