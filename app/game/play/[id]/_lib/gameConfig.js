/**
 * Pure game-rule helpers shared by the play page, its hooks, and screens.
 *
 * Extracted from the previous monolith `app/game/play/[id]/page.js` as part
 * of Phase 2a of the architecture refactor.
 */

export const DIFFICULTY_CONFIG = {
  Easy:   { basePoints: 100, timeBonus: 20, timer: 60 },
  Medium: { basePoints: 150, timeBonus: 30, timer: 45 },
  Hard:   { basePoints: 200, timeBonus: 40, timer: 30 },
};

export function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Easy;
}

/**
 * Compute points awarded for a correct answer, including a fast-answer bonus.
 */
export function computePoints(level, timeLeft) {
  const cfg = getDifficultyConfig(level?.difficulty);
  const fastBonus = timeLeft > cfg.timer * 0.5 ? cfg.timeBonus : 0;
  return cfg.basePoints + fastBonus;
}

/**
 * Standard 60% pass threshold derived from total questions.
 */
export function passThreshold(totalQuestions) {
  return Math.floor(totalQuestions * 0.6);
}

/**
 * Star rating for the level-complete screen:
 *  3 stars = perfect, 2 = ≥80%, 1 = passed, 0 = failed.
 */
export function deriveStarRating({ correctAnswers, totalQuestions }) {
  if (totalQuestions === 0) return 0;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  const passed = correctAnswers >= passThreshold(totalQuestions);
  if (correctAnswers === totalQuestions) return 3;
  if (accuracy >= 80) return 2;
  if (passed) return 1;
  return 0;
}

/**
 * The correctness-driving index for a question, supporting both
 * `correctIndex` (canonical) and legacy `correctAnswer` keys.
 */
export function getCorrectIndex(question) {
  if (!question) return undefined;
  return question.correctIndex !== undefined ? question.correctIndex : question.correctAnswer;
}
