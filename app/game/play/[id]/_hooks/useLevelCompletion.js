'use client';

import { useCallback } from 'react';
import { passThreshold } from '../_lib/gameConfig';
import { checkAchievements } from '../../../../../utils/achievements';
import { playLevelComplete, playAchievement } from '../../../../../utils/sounds';

/**
 * Encapsulates the level-completion side-effects: building final stats,
 * checking achievements, calling the persistence API, and flipping the
 * `levelComplete` flag.
 */
export function useLevelCompletion(deps) {
  const {
    questions,
    answeredQuestions,
    levelId,
    score,
    user,
    maxStreak,
    fastestAnswer,
    hintsRemaining,
    userStatsRef,
    userAchievements,
    setLevelComplete,
    setUserStats,
    setUserAchievements,
    setNewAchievement,
  } = deps;

  return useCallback(async () => {
    const totalQuestions = questions.length;
    const correctAnswers = answeredQuestions.filter((q) => q.isCorrect).length;
    const passed = correctAnswers >= passThreshold(totalQuestions);
    const isPerfectScore = correctAnswers === totalQuestions;

    let isComeback = false;
    if (passed && user?.id) {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        const prev = (data.progress || []).find((p) => p.levelId === levelId);
        if (prev && !prev.completed) isComeback = true;
      } catch {
        // best-effort comeback detection — ignore failures
      }
    }

    setLevelComplete(true);
    playLevelComplete();

    const latest = userStatsRef.current;
    const sessionCorrect = answeredQuestions.filter((q) => q.isCorrect).length;
    const sessionTotal = answeredQuestions.length;
    const finalStats = {
      ...latest,
      correctAnswers: (latest.correctAnswers || 0) + sessionCorrect,
      totalAnswers: (latest.totalAnswers || 0) + sessionTotal,
      maxStreak: Math.max(latest.maxStreak || 0, maxStreak),
      fastestAnswer: Math.min(latest.fastestAnswer || Infinity, fastestAnswer),
      levelsCompleted: passed ? (latest.levelsCompleted || 0) + 1 : (latest.levelsCompleted || 0),
      perfectScores: isPerfectScore ? (latest.perfectScores || 0) + 1 : (latest.perfectScores || 0),
      noHintLevels: hintsRemaining === 3 && passed
        ? (latest.noHintLevels || 0) + 1
        : (latest.noHintLevels || 0),
      comebacks: isComeback ? (latest.comebacks || 0) + 1 : (latest.comebacks || 0),
    };

    setUserStats(finalStats);

    if (user?.id) {
      try {
        const newAchievements = checkAchievements(finalStats, userAchievements);
        if (newAchievements.length > 0) {
          playAchievement();
          setNewAchievement(newAchievements[0]);
          const all = [...userAchievements, ...newAchievements];
          setUserAchievements(all);
          localStorage.setItem(`achievements_${user.id}`, JSON.stringify(all));
        }
      } catch (err) {
        console.error('Error checking achievements:', err);
      }

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ levelId, score, completed: passed }),
        });
        if (passed) localStorage.removeItem(`lastPlayedLevel_${user.id}`);
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    }
  }, [
    questions,
    answeredQuestions,
    levelId,
    score,
    user,
    maxStreak,
    fastestAnswer,
    hintsRemaining,
    userStatsRef,
    userAchievements,
    setLevelComplete,
    setUserStats,
    setUserAchievements,
    setNewAchievement,
  ]);
}
