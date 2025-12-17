"use client";

import { useState, useEffect } from "react";
import {
  DifficultyLevel,
  DIFFICULTY_LEVELS,
  ALL_LOCATIONS,
  getProgress,
  saveProgress,
  getDifficultyDisplayName,
} from "@/lib/progress";

interface DevToolsProps {
  onProgressChange: () => void;
}

export default function DevTools({ onProgressChange }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>("beginner");
  const [locationStages, setLocationStages] = useState<Record<string, number>>({});

  // Only render in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    loadStagesForLevel(selectedLevel);
  }, [selectedLevel]);

  const loadStagesForLevel = (level: DifficultyLevel) => {
    const progress = getProgress();
    const difficultyProgress = progress.difficulties[level] ?? {};
    const stages: Record<string, number> = {};
    for (const loc of ALL_LOCATIONS) {
      stages[loc] = difficultyProgress[loc]?.completedStages ?? 0;
    }
    setLocationStages(stages);
  };

  const handleStageChange = (location: string, value: number) => {
    const progress = getProgress();
    
    if (!progress.difficulties[selectedLevel]) {
      progress.difficulties[selectedLevel] = {};
    }
    
    if (!progress.difficulties[selectedLevel]![location]) {
      progress.difficulties[selectedLevel]![location] = {
        completedStages: 0,
        completedAt: [],
        completedTopics: [],
      };
    }
    
    progress.difficulties[selectedLevel]![location].completedStages = value;
    saveProgress(progress);
    
    setLocationStages((prev) => ({ ...prev, [location]: value }));
    onProgressChange();
  };

  const formatLocationName = (slug: string) => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono hover:bg-gray-700 transition-colors"
      >
        🛠️ Dev
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-[70vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h3 className="font-bold text-gray-800">Dev Tools</h3>
            <p className="text-xs text-gray-500">Control progress per level</p>
          </div>

          <div className="p-4 space-y-4">
            {/* Level selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {getDifficultyDisplayName(level)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location stages */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Lessons Completed (0-3)
              </label>
              {ALL_LOCATIONS.map((location) => (
                <div key={location} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-600 flex-1">
                    {formatLocationName(location)}
                  </span>
                  <select
                    value={locationStages[location] ?? 0}
                    onChange={(e) => handleStageChange(location, parseInt(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-800 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

