// Client-side wrapper that calls the server-side /api/questions endpoint.
// All AI generation and API key handling happens server-side.

import { LEVEL_DEFINITIONS } from '../constants/levels';

const pendingRequests = {};

const questionCache = new Map();
const CACHE_DURATION = Infinity; // Cache indefinitely to prevent repeated API calls

/**
 * Generates questions for a specific level by calling the server API
 * @param {number} levelId - The level ID
 * @returns {Promise<Array>} - Array of question objects
 */
export async function generateQuestionsForLevel(levelId) {
  // Check client cache first
  const cacheKey = `level_${levelId}`;
  const cachedData = questionCache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Using cached questions for level ${levelId}`);
    return JSON.parse(JSON.stringify(cachedData.questions));
  }

  // Prevent duplicate simultaneous requests
  if (pendingRequests[cacheKey]) {
    return pendingRequests[cacheKey];
  }

  pendingRequests[cacheKey] = (async () => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: parseInt(levelId) }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const questions = data.questions;

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions returned from server');
      }

      // Cache the questions client-side
      questionCache.set(cacheKey, {
        questions,
        timestamp: Date.now(),
        levelId: parseInt(levelId),
      });

      return JSON.parse(JSON.stringify(questions));
    } finally {
      delete pendingRequests[cacheKey];
    }
  })();

  return pendingRequests[cacheKey];
}

/**
 * Utility function to get level definitions.
 * Backed by the single source of truth in `constants/levels.js`.
 * @returns {Array} - Array of level definitions
 */
export function getLevelDefinitions() {
  return LEVEL_DEFINITIONS;
}
