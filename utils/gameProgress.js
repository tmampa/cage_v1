import {
  saveFirebaseLevelProgress,
  getFirebaseUserProgress,
  getFirebaseLevelProgress,
  updateFirebaseUserTotalScore,
  getFirebaseUnlockedLevels,
  unlockFirebaseNextLevel,
  initializeFirebaseUserProgress,
  getFirebaseLeaderboardData,
} from '../lib/firebase';

/**
 * Save a user's level progress
 * @param {string} userId - The user's ID
 * @param {number} levelId - The completed level ID
 * @param {number} score - The user's score for this level
 * @param {boolean} completed - Whether the level was successfully completed
 * @returns {Promise} - Operation result
 */
export async function saveLevelProgress(userId, levelId, score, completed) {
  return saveFirebaseLevelProgress(userId, levelId, score, completed);
}

/**
 * Get a user's progress for all levels
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of level progress objects
 */
export async function getUserProgress(userId) {
  return getFirebaseUserProgress(userId);
}

/**
 * Get the user's progress for a specific level
 * @param {string} userId - The user's ID
 * @param {number} levelId - The level ID
 * @returns {Promise<Object>} - Level progress object
 */
export async function getLevelProgress(userId, levelId) {
  return getFirebaseLevelProgress(userId, levelId);
}

/**
 * Calculate and update a user's total score across all levels
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - The updated total score
 */
export async function updateUserTotalScore(userId) {
  return updateFirebaseUserTotalScore(userId);
}

/**
 * Get all unlocked levels for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} - Array of unlocked level IDs
 */
export async function getUnlockedLevels(userId) {
  return getFirebaseUnlockedLevels(userId);
}

/**
 * Unlock the next level after completing a level
 * @param {string} userId - The user's ID
 * @param {number} completedLevelId - The ID of the level that was just completed
 * @returns {Promise<boolean>} - Success status
 */
export async function unlockNextLevel(userId, completedLevelId) {
  return unlockFirebaseNextLevel(userId, completedLevelId);
}

/**
 * Initialize a new user's game progress
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Success status
 */
export async function initializeUserProgress(userId) {
  return initializeFirebaseUserProgress(userId);
}

// Re-export the leaderboard data function
export { getFirebaseLeaderboardData };
