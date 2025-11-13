/**
 * Chatbot Context Tracking Utility
 * 
 * This utility provides helper functions to extract and format game context
 * for the chatbot to provide context-aware assistance.
 */

/**
 * Extract context from the home page
 * @param {Object} userProfile - User profile data
 * @param {Object} levelProgress - User's level progress data
 * @returns {Object} Formatted context for home page
 */
export function extractHomeContext(userProfile, levelProgress) {
  return {
    currentPage: 'home',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: {
      completedLevels: levelProgress?.completedLevels || [],
      unlockedLevels: levelProgress?.unlockedLevels || 1,
      currentScore: userProfile?.score || 0,
      username: userProfile?.username || 'User',
    },
  };
}

/**
 * Extract context from the levels page
 * @param {Array} levels - Array of level objects
 * @param {Object} progressStats - User's progress statistics
 * @param {Object} userProfile - User profile data
 * @param {string} viewMode - Current view mode ('map' or 'grid')
 * @returns {Object} Formatted context for levels page
 */
export function extractLevelsContext(levels, progressStats, userProfile, viewMode = 'map') {
  const unlockedLevels = levels.filter(l => l.unlocked);
  const completedLevels = levels.filter(l => l.completed);
  const nextLevel = levels.find(l => l.unlocked && !l.completed);

  return {
    currentPage: 'levels',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: {
      completedLevels: completedLevels.map(l => l.id),
      unlockedLevels: unlockedLevels.map(l => l.id),
      currentScore: userProfile?.score || 0,
      username: userProfile?.username || 'User',
      totalLevels: levels.length,
      completedCount: progressStats?.completedCount || 0,
      progressPercentage: progressStats?.progressPercentage || 0,
      nextLevel: nextLevel ? {
        id: nextLevel.id,
        title: nextLevel.title,
        difficulty: nextLevel.difficulty,
      } : null,
      viewMode,
    },
  };
}

/**
 * Extract context from a question/gameplay page
 * @param {Object} level - Current level object
 * @param {Object} currentQuestion - Current question object
 * @param {number} currentQuestionIndex - Index of current question
 * @param {number} totalQuestions - Total number of questions
 * @param {number} score - Current score
 * @param {number} lives - Remaining lives
 * @param {Object} userProfile - User profile data
 * @returns {Object} Formatted context for question page
 */
export function extractQuestionContext(
  level,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  score,
  lives,
  userProfile
) {
  return {
    currentPage: 'question',
    levelId: level?.id || null,
    levelTitle: level?.title || null,
    levelDescription: level?.description || null,
    questionText: currentQuestion?.question || null,
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: totalQuestions,
    userProgress: {
      currentScore: score,
      remainingLives: lives,
      username: userProfile?.username || 'User',
      totalUserScore: userProfile?.score || 0,
      difficulty: level?.difficulty || 'Unknown',
    },
  };
}

/**
 * Extract context from the profile page
 * @param {Object} userProfile - User profile data
 * @param {Array} achievements - User's achievements
 * @param {Object} progressStats - User's progress statistics
 * @returns {Object} Formatted context for profile page
 */
export function extractProfileContext(userProfile, achievements, progressStats) {
  return {
    currentPage: 'profile',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: {
      username: userProfile?.username || 'User',
      currentScore: userProfile?.score || 0,
      avatarEmoji: userProfile?.avatar_emoji || '👤',
      completedLevels: progressStats?.completedLevels || [],
      totalAchievements: achievements?.length || 0,
      earnedAchievements: achievements?.filter(a => a.earnedAt).length || 0,
    },
  };
}

/**
 * Extract context from the leaderboard page
 * @param {Object} userProfile - User profile data
 * @param {number} userRank - User's rank on leaderboard
 * @param {number} totalPlayers - Total number of players
 * @returns {Object} Formatted context for leaderboard page
 */
export function extractLeaderboardContext(userProfile, userRank, totalPlayers) {
  return {
    currentPage: 'leaderboard',
    levelId: null,
    levelTitle: null,
    levelDescription: null,
    questionText: null,
    questionNumber: null,
    totalQuestions: null,
    userProgress: {
      username: userProfile?.username || 'User',
      currentScore: userProfile?.score || 0,
      rank: userRank || null,
      totalPlayers: totalPlayers || 0,
    },
  };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Format context for display or debugging
 * @param {Object} context - Context object
 * @returns {string} Formatted context string
 */
export function formatContextForDisplay(context) {
  const parts = [];
  
  parts.push(`Page: ${context.currentPage}`);
  
  if (context.levelTitle) {
    parts.push(`Level: ${context.levelTitle}`);
  }
  
  if (context.questionNumber && context.totalQuestions) {
    parts.push(`Question: ${context.questionNumber}/${context.totalQuestions}`);
  }
  
  if (context.userProgress?.currentScore !== undefined) {
    parts.push(`Score: ${context.userProgress.currentScore}`);
  }
  
  return parts.join(' | ');
}
