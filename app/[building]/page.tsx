"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import ChatInterface from "@/components/ChatInterface";
import ConversationEnding from "@/components/ConversationEnding";
import {
  getCharacterName,
  getCharacterRole,
  getOpeningMessage,
} from "@/lib/characters";
import {
  completeConversation,
  getGlobalLevel,
  getDifficultyDisplayName,
  DifficultyLevel,
} from "@/lib/progress";
import { getLearningLanguage, getNativeLanguage } from "@/lib/language";
import { selectNextTopic, completeTopic } from "@/lib/topicSelection";
import { Topic } from "@/lib/topics";

interface BuildingPageProps {
  params: Promise<{
    building: string;
  }>;
}

function formatBuildingName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function BuildingPage({ params }: BuildingPageProps) {
  const { building } = use(params);
  const [conversationState, setConversationState] = useState<
    "active" | "ending" | "levelUp"
  >("active");
  const [isClient, setIsClient] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [newLevel, setNewLevel] = useState<DifficultyLevel | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [learningLanguage, setLearningLanguage] = useState<string>("en");
  const [nativeLanguage, setNativeLanguage] = useState<string>("en");

  useEffect(() => {
    setIsClient(true);
    const currentDifficulty = getGlobalLevel();
    setDifficulty(currentDifficulty);
    setLearningLanguage(getLearningLanguage());
    setNativeLanguage(getNativeLanguage());

    // Select topic for this conversation
    const topic = selectNextTopic(building, currentDifficulty);
    setSelectedTopic(topic);
  }, [building]);

  const buildingName = formatBuildingName(building);
  const characterName = isClient
    ? getCharacterName(
        building,
        learningLanguage as "en" | "it" | "es" | "fr" | "de"
      )
    : "";
  const characterRole = isClient
    ? getCharacterRole(
        building,
        learningLanguage as "en" | "it" | "es" | "fr" | "de"
      )
    : "";
  const openingMessage = isClient
    ? getOpeningMessage(
        building,
        learningLanguage as "en" | "it" | "es" | "fr" | "de"
      )
    : "";

  const handleConversationEnd = () => {
    setConversationState("ending");
  };

  const handleCountdownComplete = () => {
    // Mark topic as complete (only if topic exists)
    if (selectedTopic) {
      completeTopic(building, difficulty, selectedTopic.id);
    }

    const result = completeConversation(building);
    if (result.advanced && result.newLevel) {
      setNewLevel(result.newLevel);
      setConversationState("levelUp");
    }
    // Navigation happens in ConversationEnding component
  };

  // Show loading state while hydrating
  if (!isClient) {
    return (
      <div className="py-8 sm:py-12 min-h-screen">
        <div className="mb-6">
          <div className="h-6 w-32 bg-white/50 rounded animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-white/50 rounded animate-pulse mb-8" />
        <div className="h-96 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (conversationState === "levelUp" && newLevel) {
    return (
      <div className="py-8 sm:py-12 min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-8 py-12 shadow-xl text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-[#2d5a3d] mb-4">Level Up!</h2>
          <p className="text-[#4a7c59] mb-6">
            Congratulations! You&apos;ve completed all lessons at the{" "}
            {getDifficultyDisplayName(difficulty)} level!
          </p>
          <p className="text-xl font-semibold text-[#2d5a3d] mb-8">
            Welcome to{" "}
            <span className="text-purple-600">
              {getDifficultyDisplayName(newLevel)}
            </span>
            !
          </p>
          <Link
            href="/"
            className="
              inline-block px-8 py-3 rounded-full
              bg-[#4a7c59] text-white font-semibold
              hover:bg-[#3d6b4a] active:scale-95
              transition-all duration-200
            "
          >
            Continue to Town
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 min-h-screen">
      {conversationState === "active" ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="
                inline-flex items-center gap-2
                text-[#2d5a3d] font-semibold
                hover:text-[#4a7c59]
                transition-colors duration-200
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Town</span>
            </Link>

            {/* Difficulty indicator */}
            <span
              className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${
                difficulty === "beginner"
                  ? "bg-green-500"
                  : difficulty === "intermediate"
                  ? "bg-blue-500"
                  : "bg-purple-500"
              }
              text-white
            `}
            >
              {getDifficultyDisplayName(difficulty)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2d5a3d] mb-6">
            {buildingName}
          </h1>

          <ChatInterface
            characterName={characterName}
            role={characterRole}
            location={buildingName}
            openingMessage={openingMessage}
            difficulty={difficulty}
            topic={selectedTopic || undefined}
            nativeLanguage={nativeLanguage}
            learningLanguage={learningLanguage}
            onConversationEnd={handleConversationEnd}
          />
        </>
      ) : (
        <ConversationEnding onComplete={handleCountdownComplete} />
      )}
    </div>
  );
}
