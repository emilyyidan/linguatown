"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BuildingCard from "@/components/BuildingCard";
import DevTools from "@/components/DevTools";
import {
  getAllLocationStages,
  getGlobalLevel,
  setGlobalLevel,
  getDifficultyDisplayName,
  getTotalProgressForCurrentLevel,
  DifficultyLevel,
  DIFFICULTY_LEVELS,
  STAGES_PER_LOCATION,
  ALL_LOCATIONS,
} from "@/lib/progress";
import {
  getLearningLanguage,
  setLearningLanguage,
  getAvailableLearningLanguages,
  getLanguageDisplayName,
  getLanguageFlag,
  Language,
} from "@/lib/language";

// Building positions as percentages within the 9:16 aspect ratio container
// These will scale proportionally with the container size
const buildings = [
  { name: "Bank", slug: "bank", top: "15%", right: "14%" },
  { name: "Restaurant", slug: "restaurant", top: "5%", left: "18%" },
  { name: "Bakery", slug: "bakery", top: "72%", right: "18%" },
  { name: "Grocery Store", slug: "grocery-store", top: "42%", right: "8%" },
  { name: "Hotel", slug: "hotel", top: "55%", left: "16%" },
  { name: "School", slug: "school", top: "30%", right: "30%" },
];

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: "bg-green-500",
  intermediate: "bg-blue-500",
  advanced: "bg-purple-500",
};

const difficultyHoverColors: Record<DifficultyLevel, string> = {
  beginner: "hover:bg-green-600",
  intermediate: "hover:bg-blue-600",
  advanced: "hover:bg-purple-600",
};

function HomeContent() {
  const [stages, setStages] = useState<Record<string, number>>({});
  const [globalLevel, setGlobalLevelState] =
    useState<DifficultyLevel>("beginner");
  const [progress, setProgress] = useState({ completed: 0, total: 18 });
  const [isClient, setIsClient] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [learningLanguage, setLearningLanguageState] = useState<Language>("en");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const buildingRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchParams = useSearchParams();
  const [buildingToAnimate, setBuildingToAnimate] = useState<string | null>(
    null
  );

  const refreshProgress = () => {
    setStages(getAllLocationStages());
    setGlobalLevelState(getGlobalLevel());
    setProgress(getTotalProgressForCurrentLevel());
  };

  useEffect(() => {
    setIsClient(true);
    setLearningLanguageState(getLearningLanguage());
    refreshProgress();
  }, []);

  // Scroll to building and trigger animation when returning from a conversation
  useEffect(() => {
    const buildingSlug = searchParams.get("building");
    if (buildingSlug && isClient) {
      // Set flag to trigger animation for this building
      setBuildingToAnimate(buildingSlug);

      // Wait for DOM to update with new progress, then scroll
      setTimeout(() => {
        const buildingElement = buildingRefs.current[buildingSlug];
        if (buildingElement) {
          buildingElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        // Clean up URL parameter
        window.history.replaceState({}, "", "/");

        // Clear animation flag after animation completes
        setTimeout(() => {
          setBuildingToAnimate(null);
        }, 600);
      }, 100);
    }
  }, [searchParams, isClient]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLevelChange = (level: DifficultyLevel) => {
    setGlobalLevel(level);
    setGlobalLevelState(level);
    setIsDropdownOpen(false);
    // Refresh stages for the new level
    refreshProgress();
  };

  const handleLanguageChange = (language: Language) => {
    // Preserve the current difficulty level when switching languages
    const currentDifficulty = globalLevel;

    setLearningLanguage(language);
    setLearningLanguageState(language);
    setIsLanguageDropdownOpen(false);

    // Set the difficulty level for the new language to match the current one
    // This ensures the difficulty preference persists across language switches
    setGlobalLevel(currentDifficulty);

    // Refresh progress for the new language
    refreshProgress();
  };

  const totalStages = ALL_LOCATIONS.length * STAGES_PER_LOCATION;

  return (
    <div className="py-6 sm:py-8 md:py-10 relative z-10">
      {/* Header with level indicator */}
      <div className="text-center mb-4 sm:mb-6 md:mb-8 relative z-20 px-4 py-4 sm:px-6 sm:py-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2d5a3d] mb-4">
          Lingua Town
        </h1>

        {/* Language and difficulty dropdowns aligned horizontally */}
        {isClient && (
          <div className="flex flex-row items-center justify-center gap-3 flex-wrap">
            {/* Language picker */}
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() =>
                  setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                }
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-full
                  bg-white/90 backdrop-blur-sm text-[#2d5a3d] font-semibold
                  shadow-md cursor-pointer border-2 border-[#4a7c59]/30
                  hover:border-[#4a7c59] hover:bg-white
                  transition-all duration-200
                "
              >
                <span>{getLanguageFlag(learningLanguage)}</span>
                <span>{getLanguageDisplayName(learningLanguage)}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    isLanguageDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Language dropdown menu */}
              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  {getAvailableLearningLanguages().map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`
                        w-full px-4 py-3 text-left font-medium
                        transition-colors duration-150
                        ${
                          lang === learningLanguage
                            ? "bg-[#4a7c59] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getLanguageFlag(lang)}</span>
                        {getLanguageDisplayName(lang)}
                        {lang === learningLanguage && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-auto"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clickable difficulty selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-full
                  ${difficultyColors[globalLevel]} text-white font-semibold
                  shadow-md cursor-pointer
                  ${difficultyHoverColors[globalLevel]}
                  transition-colors duration-200
                `}
              >
                <span>{getDifficultyDisplayName(globalLevel)}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-50 min-w-[160px]">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => handleLevelChange(level)}
                      className={`
                        w-full px-4 py-3 text-left font-medium
                        transition-colors duration-150
                        ${
                          level === globalLevel
                            ? `${difficultyColors[level]} text-white`
                            : "text-gray-700 hover:bg-gray-100"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${difficultyColors[level]}`}
                        />
                        {getDifficultyDisplayName(level)}
                        {level === globalLevel && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-auto"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isClient && (
          <div className="flex flex-col items-center gap-3 mt-3">
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-[#4a7c59] mb-1">
                <span>Progress</span>
                <span>
                  {progress.completed} / {totalStages}
                </span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className={`h-full ${difficultyColors[globalLevel]} transition-all duration-500`}
                  style={{
                    width: `${(progress.completed / totalStages) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Town wrapper with fixed aspect ratio */}
      <div className="w-full flex justify-center px-4">
        <div className="town-wrapper">
          {/* Buildings positioned absolutely over background */}
          <div
            className="town-background"
            style={{
              backgroundImage: 'url("/road.png")',
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {buildings.map((building) => (
              <div
                key={building.slug}
                ref={(el) => {
                  buildingRefs.current[building.slug] = el;
                }}
                className="absolute"
                style={{
                  top: building.top,
                  left: building.left,
                  right: building.right,
                }}
              >
                <BuildingCard
                  name={building.name}
                  slug={building.slug}
                  stages={isClient ? stages[building.slug] ?? 0 : 0}
                  shouldAnimate={buildingToAnimate === building.slug}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dev tools - only visible in development */}
      <DevTools onProgressChange={refreshProgress} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={<div className="py-6 sm:py-8 md:py-10">Loading...</div>}
    >
      <HomeContent />
    </Suspense>
  );
}
