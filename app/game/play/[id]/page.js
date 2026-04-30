'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../../../context/AuthContext';
import { QuestionGenerationLoader, LevelLoadingSpinner } from '../../../../components/LoadingSpinner';
import { DEFAULT_USER_STATS } from '../../../../utils/achievements';
import { extractQuestionContext, throttle } from '../../../../utils/chatbotContext';

import { useGameSession } from './_hooks/useGameSession';
import { useGameTimer } from './_hooks/useGameTimer';
import { useAnswerScoring } from './_hooks/useAnswerScoring';
import { useLevelCompletion } from './_hooks/useLevelCompletion';
import { getDifficultyConfig } from './_lib/gameConfig';

import ActiveGameLayout from './_components/ActiveGameLayout';
import GameOverScreen from './_components/GameOverScreen';
import LevelCompleteScreen from './_components/LevelCompleteScreen';

export default function GameplayPage({ params }) {
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const unwrappedParams = React.use(params);
  const levelId = parseInt(unwrappedParams.id);

  const { loading, generatingQuestions, error, level, questions } = useGameSession({
    levelId,
    userId: user?.id,
    isAdmin: user?.isAdmin,
  });

  // Gameplay state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [fastestAnswer, setFastestAnswer] = useState(Infinity);
  const [newAchievement, setNewAchievement] = useState(null);
  const [userStats, setUserStats] = useState(DEFAULT_USER_STATS);
  const [userAchievements, setUserAchievements] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showReview, setShowReview] = useState(false);

  // Keep latest userStats in a ref so closures (achievement checks) see fresh values.
  const userStatsRef = useRef(userStats);
  useEffect(() => {
    userStatsRef.current = userStats;
  }, [userStats]);

  const currentQuestion = questions[currentQuestionIndex];
  const difficultyTimer = level ? getDifficultyConfig(level.difficulty).timer : 60;

  /* eslint-disable react-hooks/set-state-in-effect -- intentional resets coordinated by session/question changes */
  // Reset gameplay state when a fresh session/level is ready.
  useEffect(() => {
    if (loading || generatingQuestions || !level) return;

    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setAnsweredQuestions([]);
    setShowReview(false);
    setGameOver(false);
    setLevelComplete(false);
    setHintsRemaining(3);
    setCurrentStreak(0);
    setMaxStreak(0);
    setFastestAnswer(Infinity);
    setQuestionStartTime(Date.now());

    if (user?.id) {
      const savedAchievements = localStorage.getItem(`achievements_${user.id}`);
      if (savedAchievements) setUserAchievements(JSON.parse(savedAchievements));
      setUserStats({ ...DEFAULT_USER_STATS });
    }
  }, [loading, generatingQuestions, level, user?.id]);

  // Reset question start timestamp on question change.
  useEffect(() => {
    if (currentQuestion && !showExplanation) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, currentQuestion, showExplanation]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sync chatbot context with gameplay (throttled)
  useEffect(() => {
    if (loading || generatingQuestions || !currentQuestion || !level) return;
    const updateContext = throttle(() => {
      extractQuestionContext(
        level,
        currentQuestion,
        currentQuestionIndex,
        questions.length,
        score,
        lives,
        userProfile
      );
    }, 1000);
    updateContext();
  }, [
    currentQuestion,
    currentQuestionIndex,
    level,
    questions.length,
    score,
    lives,
    userProfile,
    loading,
    generatingQuestions,
  ]);

  // Redirect admins
  useEffect(() => {
    if (user?.isAdmin) router.replace('/admin');
  }, [user?.isAdmin, router]);

  // Timeout handler — runs when question timer hits zero
  const handleTimeout = useCallback(() => {
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) setGameOver(true);
      return next;
    });
    setIsAnswerCorrect(false);
    setShowExplanation(true);
  }, []);

  const timerEnabled = !loading && !gameOver && !levelComplete && !showExplanation && !!currentQuestion;
  const { timeLeft, setTimeLeft } = useGameTimer({
    enabled: timerEnabled,
    initialTime: difficultyTimer,
    onTimeout: handleTimeout,
    resetKey: currentQuestionIndex,
  });

  const handleAnswerSelect = useAnswerScoring({
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
  });

  const completeLevel = useLevelCompletion({
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
  });

  const handleHintUsed = useCallback(() => {
    setHintsRemaining((prev) => Math.max(0, prev - 1));
    setUserStats((prev) => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(difficultyTimer);
      setIsAnswerCorrect(null);
      setQuestionStartTime(Date.now());
    } else {
      completeLevel();
    }
  }, [currentQuestionIndex, questions.length, difficultyTimer, setTimeLeft, completeLevel]);

  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  if (loading || generatingQuestions) {
    return generatingQuestions ? <QuestionGenerationLoader /> : <LevelLoadingSpinner />;
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4'>
        <div className='game-card p-8 text-center'>
          <XCircleIcon className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-purple-700 mb-3'>Oops! Something went wrong</h2>
          <p className='text-blue-700 mb-6'>{error}</p>
          <Link href='/game/levels'>
            <button className='btn-primary'>Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4'>
        <div className='game-card p-8 text-center'>
          <XCircleIcon className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-purple-700 mb-3'>No Questions Available</h2>
          <p className='text-blue-700 mb-6'>
            We couldn&apos;t generate questions for this level. Fallback questions have been removed from the system.
          </p>
          <Link href='/game/levels'>
            <button className='btn-primary'>Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen
        score={score}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (levelComplete) {
    return (
      <LevelCompleteScreen
        levelId={levelId}
        questions={questions}
        answeredQuestions={answeredQuestions}
        score={score}
        maxStreak={maxStreak}
        showReview={showReview}
        setShowReview={setShowReview}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return (
    <ActiveGameLayout
      level={level}
      levelId={levelId}
      questions={questions}
      currentQuestionIndex={currentQuestionIndex}
      currentQuestion={currentQuestion}
      selectedAnswer={selectedAnswer}
      showExplanation={showExplanation}
      isAnswerCorrect={isAnswerCorrect}
      score={score}
      lives={lives}
      timeLeft={timeLeft}
      hintsRemaining={hintsRemaining}
      currentStreak={currentStreak}
      newAchievement={newAchievement}
      onAchievementClose={() => setNewAchievement(null)}
      onAnswerSelect={handleAnswerSelect}
      onHintUsed={handleHintUsed}
      onNextQuestion={handleNextQuestion}
    />
  );
}
