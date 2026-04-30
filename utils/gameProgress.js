/**
 * Game progress utilities — all calls now go to the /api/progress route.
 * No Firebase dependency.
 */

/**
 * Save a user's level progress.
 * @param {number} userId  — kept for API compatibility but not sent (server reads from JWT cookie)
 * @param {number} levelId
 * @param {number} score
 * @param {boolean} completed
 */
export async function saveLevelProgress(userId, levelId, score, completed) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelId, score, completed }),
  });
  return res.json();
}

/**
 * Get a user's progress for all levels.
 * @returns {Promise<Array>}
 */
export async function getUserProgress() {
  const res = await fetch('/api/progress');
  const data = await res.json();
  return data.progress || [];
}

/**
 * Get the user's progress for a specific level.
 * @param {number} userId  — kept for API compatibility
 * @param {number} levelId
 */
export async function getLevelProgress(userId, levelId) {
  const progress = await getUserProgress();
  return progress.find(p => p.levelId === levelId) || null;
}

/**
 * No-op — score is recalculated server-side on every POST /api/progress.
 */
export async function updateUserTotalScore() {
  return 0;
}

/**
 * Get all unlocked level IDs for a user.
 * Level 1 is always unlocked; subsequent levels unlock after the prior is completed.
 * @returns {Promise<number[]>}
 */
export async function getUnlockedLevels() {
  const progress = await getUserProgress();
  const completedIds = progress.filter(p => p.completed).map(p => p.levelId);
  const highest = completedIds.length > 0 ? Math.max(...completedIds) : 0;
  const unlocked = [];
  for (let i = 1; i <= highest + 1; i++) {
    unlocked.push(i);
  }
  return unlocked.length > 0 ? unlocked : [1];
}

/**
 * No-op — unlock logic is handled server-side.
 */
export async function unlockNextLevel() {
  return true;
}

/**
 * No-op — level 1 is always accessible (no explicit init needed).
 */
export async function initializeUserProgress() {
  return true;
}

/**
 * Fetch leaderboard data from the API.
 * @param {string} timeFilter — 'all' | 'week' | 'month'
 */
export async function getLeaderboardData(timeFilter = 'all') {
  const res = await fetch(`/api/leaderboard?filter=${timeFilter}`);
  const data = await res.json();
  return data.leaderboard || [];
}
