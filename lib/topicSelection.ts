import { DifficultyLevel } from "./progress";
import { getCompletedTopics, markTopicComplete } from "./progress";
import { getAllTopicIdsForLocation, getTopicById, Topic } from "./topics";

/**
 * Selects the next topic for a conversation, prioritizing new topics.
 * If all topics have been completed, returns a random one.
 */
export function selectNextTopic(
  locationSlug: string,
  difficulty: DifficultyLevel
): Topic | null {
  const allTopicIds = getAllTopicIdsForLocation(locationSlug, difficulty);
  if (allTopicIds.length === 0) return null;

  const completedTopicIds = getCompletedTopics(locationSlug);
  const availableTopicIds = allTopicIds.filter(
    (id) => !completedTopicIds.includes(id)
  );

  let selectedTopicId: string;

  if (availableTopicIds.length > 0) {
    // Prioritize new topics - pick randomly from available
    selectedTopicId =
      availableTopicIds[Math.floor(Math.random() * availableTopicIds.length)];
  } else {
    // All topics completed, allow repeats but prefer least recently used
    // For now, just pick randomly from all topics
    selectedTopicId =
      allTopicIds[Math.floor(Math.random() * allTopicIds.length)];
  }

  return getTopicById(locationSlug, difficulty, selectedTopicId) ?? null;
}

/**
 * Marks a topic as completed after a conversation ends
 */
export function completeTopic(
  locationSlug: string,
  topicId: string
): void {
  markTopicComplete(locationSlug, topicId);
}

