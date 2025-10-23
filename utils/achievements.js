// Achievement System for CagE Cybersecurity Game

export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first level',
    icon: '👶',
    points: 50,
    condition: (stats) => stats.levelsCompleted >= 1
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    title: 'Perfect Score',
    description: 'Get 100% on any level',
    icon: '⭐',
    points: 100,
    condition: (stats) => stats.perfectScores >= 1
  },
  STREAK_MASTER: {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Answer 5 questions correctly in a row',
    icon: '🔥',
    points: 75,
    condition: (stats) => stats.maxStreak >= 5
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Answer a question in under 10 seconds',
    icon: '⚡',
    points: 60,
    condition: (stats) => stats.fastestAnswer <= 10
  },
  CYBER_GUARDIAN: {
    id: 'cyber_guardian',
    title: 'Cyber Guardian',
    description: 'Complete all 6 levels',
    icon: '🛡️',
    points: 300,
    condition: (stats) => stats.levelsCompleted >= 6
  },
  KNOWLEDGE_SEEKER: {
    id: 'knowledge_seeker',
    title: 'Knowledge Seeker',
    description: 'Answer 50 questions correctly',
    icon: '📚',
    points: 150,
    condition: (stats) => stats.correctAnswers >= 50
  },
  COMEBACK_KID: {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Pass a level after failing it once',
    icon: '💪',
    points: 80,
    condition: (stats) => stats.comebacks >= 1
  },
  HINT_MASTER: {
    id: 'hint_master',
    title: 'Hint Master',
    description: 'Complete a level without using any hints',
    icon: '🧠',
    points: 120,
    condition: (stats) => stats.noHintLevels >= 1
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Share your progress (placeholder for future feature)',
    icon: '🦋',
    points: 40,
    condition: (stats) => stats.sharesCount >= 1
  },
  FEEDBACK_HERO: {
    id: 'feedback_hero',
    title: 'Feedback Hero',
    description: 'Submit feedback to help improve the game',
    icon: '💬',
    points: 30,
    condition: (stats) => stats.feedbackSubmitted >= 1
  }
};

/**
 * Check which achievements a user has earned based on their stats
 * @param {Object} userStats - User's game statistics
 * @param {Array} currentAchievements - Currently earned achievements
 * @returns {Array} - New achievements earned
 */
export function checkAchievements(userStats, currentAchievements = []) {
  const currentAchievementIds = currentAchievements.map(a => a.id);
  const newAchievements = [];

  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!currentAchievementIds.includes(achievement.id) && 
        achievement.condition(userStats)) {
      newAchievements.push({
        ...achievement,
        earnedAt: new Date().toISOString()
      });
    }
  });

  return newAchievements;
}

/**
 * Calculate total achievement points
 * @param {Array} achievements - User's earned achievements
 * @returns {number} - Total points from achievements
 */
export function calculateAchievementPoints(achievements) {
  return achievements.reduce((total, achievement) => {
    const achievementData = ACHIEVEMENTS[achievement.id.toUpperCase()];
    return total + (achievementData?.points || 0);
  }, 0);
}

/**
 * Get achievement progress for display
 * @param {Object} userStats - User's game statistics
 * @param {Array} earnedAchievements - User's earned achievements
 * @returns {Array} - Achievement progress data
 */
export function getAchievementProgress(userStats, earnedAchievements = []) {
  const earnedIds = earnedAchievements.map(a => a.id);
  
  return Object.values(ACHIEVEMENTS).map(achievement => {
    const isEarned = earnedIds.includes(achievement.id);
    let progress = 0;
    
    // Calculate progress percentage for unearned achievements
    if (!isEarned) {
      switch (achievement.id) {
        case 'first_steps':
        case 'cyber_guardian':
          progress = Math.min((userStats.levelsCompleted / (achievement.id === 'first_steps' ? 1 : 6)) * 100, 100);
          break;
        case 'perfect_score':
          progress = Math.min((userStats.perfectScores / 1) * 100, 100);
          break;
        case 'streak_master':
          progress = Math.min((userStats.maxStreak / 5) * 100, 100);
          break;
        case 'knowledge_seeker':
          progress = Math.min((userStats.correctAnswers / 50) * 100, 100);
          break;
        case 'speed_demon':
          progress = userStats.fastestAnswer <= 10 ? 100 : Math.max(100 - (userStats.fastestAnswer - 10) * 2, 0);
          break;
        default:
          progress = 0;
      }
    } else {
      progress = 100;
    }
    
    return {
      ...achievement,
      isEarned,
      progress: Math.round(progress),
      earnedAt: isEarned ? earnedAchievements.find(a => a.id === achievement.id)?.earnedAt : null
    };
  });
}

/**
 * Default user stats structure
 */
export const DEFAULT_USER_STATS = {
  levelsCompleted: 0,
  perfectScores: 0,
  maxStreak: 0,
  currentStreak: 0,
  fastestAnswer: Infinity,
  correctAnswers: 0,
  totalAnswers: 0,
  comebacks: 0,
  noHintLevels: 0,
  sharesCount: 0,
  feedbackSubmitted: 0,
  hintsUsed: 0,
  totalPlayTime: 0
};