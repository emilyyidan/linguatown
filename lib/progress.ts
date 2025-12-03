const STORAGE_KEY = "lingua-town-progress";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
export const STAGES_PER_LOCATION = 3;
export const ALL_LOCATIONS = ["restaurant", "bakery", "school", "bank", "hotel", "grocery-store"];

export interface LocationDifficultyProgress {
  completedStages: number; // 0-3 stages completed at this difficulty
  completedAt: string[];
  completedTopics: string[]; // Array of topic IDs that have been completed
}

export interface DifficultyProgress {
  [locationSlug: string]: LocationDifficultyProgress;
}

export interface UserProgress {
  globalLevel: DifficultyLevel;
  difficulties: {
    [key in DifficultyLevel]?: DifficultyProgress;
  };
}

function getDefaultProgress(): UserProgress {
  return {
    globalLevel: "beginner",
    difficulties: {},
  };
}

export function getProgress(): UserProgress {
  if (typeof window === "undefined") return getDefaultProgress();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultProgress();
    const parsed = JSON.parse(stored);
    // Migration: handle old format
    if (!parsed.globalLevel) {
      return getDefaultProgress();
    }
    return parsed as UserProgress;
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

export function getGlobalLevel(): DifficultyLevel {
  return getProgress().globalLevel;
}

export function setGlobalLevel(level: DifficultyLevel): void {
  if (typeof window === "undefined") return;
  const progress = getProgress();
  progress.globalLevel = level;
  saveProgress(progress);
}

export function getLocationStages(locationSlug: string): number {
  const progress = getProgress();
  const currentLevel = progress.globalLevel;
  const difficultyProgress = progress.difficulties[currentLevel];
  return difficultyProgress?.[locationSlug]?.completedStages ?? 0;
}

export function getAllLocationStages(): Record<string, number> {
  const progress = getProgress();
  const currentLevel = progress.globalLevel;
  const difficultyProgress = progress.difficulties[currentLevel] ?? {};
  
  const stages: Record<string, number> = {};
  for (const location of ALL_LOCATIONS) {
    stages[location] = difficultyProgress[location]?.completedStages ?? 0;
  }
  return stages;
}

export function isLocationCompleteAtCurrentLevel(locationSlug: string): boolean {
  return getLocationStages(locationSlug) >= STAGES_PER_LOCATION;
}

export function canAdvanceToNextLevel(): boolean {
  const stages = getAllLocationStages();
  return ALL_LOCATIONS.every(loc => stages[loc] >= STAGES_PER_LOCATION);
}

export function getNextDifficultyLevel(current: DifficultyLevel): DifficultyLevel | null {
  const idx = DIFFICULTY_LEVELS.indexOf(current);
  if (idx < DIFFICULTY_LEVELS.length - 1) {
    return DIFFICULTY_LEVELS[idx + 1];
  }
  return null;
}

export function completeConversation(locationSlug: string): { advanced: boolean; newLevel?: DifficultyLevel } {
  if (typeof window === "undefined") return { advanced: false };

  const progress = getProgress();
  const currentLevel = progress.globalLevel;
  
  // Initialize difficulty progress if needed
  if (!progress.difficulties[currentLevel]) {
    progress.difficulties[currentLevel] = {};
  }
  
  const difficultyProgress = progress.difficulties[currentLevel]!;
  
  // Initialize location progress if needed
  if (!difficultyProgress[locationSlug]) {
    difficultyProgress[locationSlug] = { completedStages: 0, completedAt: [], completedTopics: [] };
  }
  
  const locationProgress = difficultyProgress[locationSlug];
  
  // Only increment if not already at max stages for this location
  if (locationProgress.completedStages < STAGES_PER_LOCATION) {
    locationProgress.completedStages += 1;
    locationProgress.completedAt.push(new Date().toISOString());
  }
  
  saveProgress(progress);
  
  // Check if we should advance to next difficulty level
  const allComplete = ALL_LOCATIONS.every(loc => {
    const locProgress = difficultyProgress[loc];
    return locProgress && locProgress.completedStages >= STAGES_PER_LOCATION;
  });
  
  if (allComplete) {
    const nextLevel = getNextDifficultyLevel(currentLevel);
    if (nextLevel) {
      progress.globalLevel = nextLevel;
      saveProgress(progress);
      return { advanced: true, newLevel: nextLevel };
    }
  }
  
  return { advanced: false };
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// For display purposes
export function getDifficultyDisplayName(level: DifficultyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function getTotalProgressForCurrentLevel(): { completed: number; total: number } {
  const stages = getAllLocationStages();
  const completed = Object.values(stages).reduce((sum, s) => sum + s, 0);
  const total = ALL_LOCATIONS.length * STAGES_PER_LOCATION;
  return { completed, total };
}

// Topic tracking functions
export function getCompletedTopics(locationSlug: string): string[] {
  const progress = getProgress();
  const currentLevel = progress.globalLevel;
  const difficultyProgress = progress.difficulties[currentLevel];
  return difficultyProgress?.[locationSlug]?.completedTopics ?? [];
}

export function markTopicComplete(locationSlug: string, topicId: string): void {
  if (typeof window === "undefined") return;

  const progress = getProgress();
  const currentLevel = progress.globalLevel;

  // Initialize difficulty progress if needed
  if (!progress.difficulties[currentLevel]) {
    progress.difficulties[currentLevel] = {};
  }

  const difficultyProgress = progress.difficulties[currentLevel]!;

  // Initialize location progress if needed
  if (!difficultyProgress[locationSlug]) {
    difficultyProgress[locationSlug] = { completedStages: 0, completedAt: [], completedTopics: [] };
  }

  const locationProgress = difficultyProgress[locationSlug];

  // Add topic if not already completed
  if (!locationProgress.completedTopics.includes(topicId)) {
    locationProgress.completedTopics.push(topicId);
    saveProgress(progress);
  }
}
