'use client';

import { useCallback } from 'react';
import { computePoints, getCorrectIndex } from '../_lib/gameConfig';
import { checkAchievements } from '../../../../../utils/achievements';
import { playCorrect, playWrong, playGameOver, playAchievement } from '../../../../../utils/sounds';

/**
 * Handles the side-effects of selecting an answer: scoring, streak tracking,
 * lives reduction, mid-game achievement checks, and the answered-questions
 * journal used by the post-level review screen.
 *
 * State setters are passed in so this hook composes cleanly with the page's
 * React state ownership instead of duplicating it.
 */
export function useAnswerScoring(deps) {
  const {
    selectedAnswer,
    showExplanation,
    currentQuestion,
    questionStartTime,
    timeLeft,
    level,
    answeredQuestions,
    userStatsRef,
    userAchievements,
    user,
    setSelectedAnswer,
    setIsAnswerCorrect,
    setAnsweredQuestions,
    setScore,
    setCurrentStreak,
    setMaxStreak,
    setFastestAnswer,
    setLives,
    setGameOver,
    setShowExplanation,
    setNewAchievement,
    setUserAchievements,
    currentStreak,
  } = deps;

  return useCallback((answerIndex) => {
    if (selectedAnswer !== null || showExplanation || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    const answerTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 60;
    const correctIndex = getCorrectIndex(currentQuestion);
    const isCorrect = answerIndex === correctIndex;
    setIsAnswerCorrect(isCorrect);

    setAnsweredQuestions((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        options: currentQuestion.options,
        selectedIndex: answerIndex,
        correctIndex,
        isCorrect,
        explanation: currentQuestion.explanation,
        hint: currentQuestion.hint,
      },
    ]);

    if (isCorrect) {
      playCorrect();
      const pointsEarned = computePoints(level, timeLeft);
      setScore((prev) => prev + pointsEarned);

      setCurrentStreak((prev) => {
        const next = prev + 1;
        setMaxStreak((current) => Math.max(current, next));
        return next;
      });

      setFastestAnswer((prev) => Math.min(prev, answerTime));

      try {
        const sessionCorrect = answeredQuestions.filter((q) => q.isCorrect).length + 1;
        const sessionTotal = answeredQuestions.length + 1;
        const midGameStats = {
          ...userStatsRef.current,
          correctAnswers: (userStatsRef.current.correctAnswers || 0) + sessionCorrect,
          totalAnswers: (userStatsRef.current.totalAnswers || 0) + sessionTotal,
          maxStreak: Math.max(userStatsRef.current.maxStreak || 0, currentStreak + 1),
        };
        const newAchievements = checkAchievements(midGameStats, userAchievements);
        if (newAchievements.length > 0) {
          playAchievement();
          const all = [...userAchievements, ...newAchievements];
          setNewAchievement(newAchievements[0]);
          setUserAchievements(all);
          if (user?.id) localStorage.setItem(`achievements_${user.id}`, JSON.stringify(all));
        }
      } catch (err) {
        console.error('Error checking achievements during gameplay:', err);
      }
    } else {
      playWrong();
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          playGameOver();
          setGameOver(true);
        }
        return next;
      });

      setCurrentStreak(0);

      try {
        const sessionTotal = answeredQuestions.length + 1;
        const midGameStats = {
          ...userStatsRef.current,
          totalAnswers: (userStatsRef.current.totalAnswers || 0) + sessionTotal,
        };
        const newAchievements = checkAchievements(midGameStats, userAchievements);
        if (newAchievements.length > 0) {
          const all = [...userAchievements, ...newAchievements];
          setNewAchievement(newAchievements[0]);
          setUserAchievements(all);
          if (user?.id) localStorage.setItem(`achievements_${user.id}`, JSON.stringify(all));
        }
      } catch (err) {
        console.error('Error checking achievements during gameplay:', err);
      }
    }

    setShowExplanation(true);
  }, [
    selectedAnswer,
    showExplanation,
    currentQuestion,
    questionStartTime,
    timeLeft,
    level,
    answeredQuestions,
    userStatsRef,
    userAchievements,
    user,
    currentStreak,
    setSelectedAnswer,
    setIsAnswerCorrect,
    setAnsweredQuestions,
    setScore,
    setCurrentStreak,
    setMaxStreak,
    setFastestAnswer,
    setLives,
    setGameOver,
    setShowExplanation,
    setNewAchievement,
    setUserAchievements,
  ]);
}
