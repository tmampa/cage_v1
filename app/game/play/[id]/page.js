'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HeartIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  HomeIcon,
  PuzzlePieceIcon,
  TrophyIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../context/AuthContext';
import { useChatbot } from '../../../../context/ChatbotContext';

import HintSystem from '../../../../components/HintSystem';
import AchievementNotification from '../../../../components/AchievementNotification';
import { QuestionGenerationLoader, LevelLoadingSpinner } from '../../../../components/LoadingSpinner';
import GameStats from '../../../../components/GameStats';
import AnswerFeedback from '../../../../components/AnswerFeedback';
import EnhancedQuestionCard from '../../../../components/EnhancedQuestionCard';
import {
  generateQuestionsForLevel,
  getLevelDefinitions,
} from '../../../../utils/generateQuestions';
import { 
  checkAchievements, 
  DEFAULT_USER_STATS 
} from '../../../../utils/achievements';
import { db } from '../../../../lib/firebase';
import { 
  saveFirebaseUserStats, 
  getFirebaseUserStats, 
  saveFirebaseAchievements, 
  getFirebaseAchievements,
  saveFirebaseLevelProgress,
  getFirebaseLevelProgress,
} from '../../../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React from 'react';
import { extractQuestionContext, throttle } from '../../../../utils/chatbotContext';
import { playCorrect, playWrong, playLevelComplete, playGameOver, playAchievement } from '../../../../utils/sounds';
import BottomNav from '../../../../components/BottomNav';

// Difficulty-based scoring and timer configuration
const DIFFICULTY_CONFIG = {
  Easy:   { basePoints: 100, timeBonus: 20, timer: 60 },
  Medium: { basePoints: 150, timeBonus: 30, timer: 45 },
  Hard:   { basePoints: 200, timeBonus: 40, timer: 30 },
};

function getDifficultyConfig(difficulty) {
  return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Easy;
}

export default function GameplayPage({ params }) {
  const router = useRouter();
  const { user, userProfile, updateProfile } = useAuth();

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const levelId = parseInt(id);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // New enhancement states
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
  const [generatingQuestions, setGeneratingQuestions] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState([]); // Track answers for review
  const [showReview, setShowReview] = useState(false); // Post-level review toggle

  // Ref for the timer
  const timerRef = React.useRef(null);

  // Ref to keep latest userStats accessible in closures (avoids stale state)
  const userStatsRef = React.useRef(userStats);
  React.useEffect(() => { userStatsRef.current = userStats; }, [userStats]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  // Get level information and load questions
  useEffect(() => {
    const loadLevelAndQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all level definitions
        const levelDefinitions = getLevelDefinitions();

        // Find the current level
        const currentLevel = levelDefinitions.find((l) => l.id === levelId);

        if (!currentLevel) {
          throw new Error(`Level with ID ${levelId} not found`);
        }

        setLevel(currentLevel);

        // Save this as the last played level
        if (user?.id) {
          localStorage.setItem(`lastPlayedLevel_${user.id}`, levelId.toString());
        }

        // Check for existing progress
        let userProgress = null;
        if (user?.id) {
          userProgress = await getFirebaseLevelProgress(user.id, levelId);
        }

        // Generate new questions or load existing ones
        try {
          setGeneratingQuestions(true);

          // Generate AI questions
          const generatedQuestions = await generateQuestionsForLevel(levelId);
          setQuestions(generatedQuestions);

          console.log(
            `Generated ${generatedQuestions.length} AI questions for level ${levelId}`
          );
        } catch (error) {
          console.error(
            'Failed to generate AI questions for level:',
            error
          );
          throw new Error(`Failed to generate questions: ${error.message}. No fallback questions available.`);
        }

        setCurrentQuestionIndex(0);
        setScore(0);
        setLives(3);
        setGeneratingQuestions(false);
        setShowExplanation(false);
        setSelectedAnswer(null);
        setAnsweredQuestions([]);
        setShowReview(false);
        // Set timer based on level difficulty
        const diffConfig = getDifficultyConfig(currentLevel.difficulty);
        setTimeLeft(diffConfig.timer);
        setGameOver(false);
        setLevelComplete(false);
        
        // Initialize enhancement states
        setHintsRemaining(3);
        setCurrentStreak(0);
        setMaxStreak(0);
        setFastestAnswer(Infinity);
        setQuestionStartTime(Date.now());

        // Load real user stats from Firestore
        if (user?.id) {
          try {
            const savedStats = await getFirebaseUserStats(user.id);
            if (savedStats) {
              const { userId: _uid, createdAt: _c, updatedAt: _u, ...statsData } = savedStats;
              setUserStats({ ...DEFAULT_USER_STATS, ...statsData });
              console.log('Loaded user stats from Firestore:', statsData);
            } else {
              setUserStats({ ...DEFAULT_USER_STATS });
            }
          } catch (statsError) {
            console.warn('Could not load user stats from Firestore:', statsError);
            setUserStats({ ...DEFAULT_USER_STATS });
          }

          // Load existing achievements from Firestore (fall back to localStorage)
          try {
            const firestoreAchievements = await getFirebaseAchievements(user.id);
            if (firestoreAchievements && firestoreAchievements.length > 0) {
              setUserAchievements(firestoreAchievements);
              console.log('Loaded achievements from Firestore:', firestoreAchievements);
            } else {
              // Migrate from localStorage if exists
              const savedAchievements = localStorage.getItem(`achievements_${user.id}`);
              if (savedAchievements) {
                const achievements = JSON.parse(savedAchievements);
                setUserAchievements(achievements);
                // Migrate to Firestore
                await saveFirebaseAchievements(user.id, achievements);
                console.log('Migrated achievements from localStorage to Firestore');
              }
            }
          } catch (achError) {
            console.warn('Could not load achievements:', achError);
          }
        }
      } catch (error) {
        console.error('Error loading level:', error);
        setError(`Failed to load level: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadLevelAndQuestions();

    // Cleanup function
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [levelId, user?.id]);

  // Handle level complete
  const completedLevel = async () => {
    // Stop the timer
    clearTimeout(timerRef.current);

    // Calculate results
    const totalQuestions = questions.length;
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const passThreshold = Math.floor(totalQuestions * 0.6); // 60% correct to pass
    const passed = correctAnswers >= passThreshold;
    const isPerfectScore = correctAnswers === totalQuestions;

    // Check if this level was previously failed (for comeback achievement)
    let isComeback = false;
    if (passed && user?.id) {
      try {
        const prevProgress = await getFirebaseLevelProgress(user.id, levelId);
        if (prevProgress && !prevProgress.completed) {
          isComeback = true;
        }
      } catch {}
    }

    setLevelComplete(true);
    playLevelComplete();

    // Build final stats from the ref (latest state) to avoid stale closure
    const latestStats = userStatsRef.current;
    const sessionCorrect = answeredQuestions.filter(q => q.isCorrect).length;
    const sessionTotal = answeredQuestions.length;
    const finalStats = {
      ...latestStats,
      correctAnswers: (latestStats.correctAnswers || 0) + sessionCorrect,
      totalAnswers: (latestStats.totalAnswers || 0) + sessionTotal,
      maxStreak: Math.max(latestStats.maxStreak || 0, maxStreak),
      fastestAnswer: Math.min(latestStats.fastestAnswer || Infinity, fastestAnswer),
      levelsCompleted: passed ? (latestStats.levelsCompleted || 0) + 1 : (latestStats.levelsCompleted || 0),
      perfectScores: isPerfectScore ? (latestStats.perfectScores || 0) + 1 : (latestStats.perfectScores || 0),
      noHintLevels: hintsRemaining === 3 && passed ? (latestStats.noHintLevels || 0) + 1 : (latestStats.noHintLevels || 0),
      comebacks: isComeback ? (latestStats.comebacks || 0) + 1 : (latestStats.comebacks || 0),
    };

    // Update the user stats state
    setUserStats(finalStats);

    // Persist stats to Firestore
    if (user?.id) {
      try {
        await saveFirebaseUserStats(user.id, finalStats);
        console.log('Saved user stats to Firestore');
      } catch (statsError) {
        console.error('Error saving user stats to Firestore:', statsError);
      }
    }

    // Check for new achievements
    try {
      console.log('Checking achievements with stats:', finalStats);
      console.log('Current user achievements:', userAchievements);
      
      const newAchievements = checkAchievements(finalStats, userAchievements);
      if (newAchievements.length > 0) {
        // Show the first new achievement
        playAchievement();
        setNewAchievement(newAchievements[0]);
        // Add to user achievements
        const allAchievements = [...userAchievements, ...newAchievements];
        setUserAchievements(allAchievements);
        console.log('New achievements earned:', newAchievements);
        
        // Save achievements to Firestore
        if (user?.id) {
          try {
            await saveFirebaseAchievements(user.id, allAchievements);
            console.log('Saved achievements to Firestore');
          } catch (achError) {
            console.error('Error saving achievements to Firestore:', achError);
          }
        }
      } else {
        console.log('No new achievements earned this time');
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }

    // Save progress to Firebase
    if (user?.id) {
      try {
        await saveFirebaseLevelProgress(user.id, levelId, score, passed);

        // If this level was completed successfully, clear the last played level
        // so the continue button moves to the next level
        if (passed) {
          localStorage.removeItem(`lastPlayedLevel_${user.id}`);
        }

        console.log(`Progress saved for level ${levelId}`);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Reset question timing when question changes
  useEffect(() => {
    if (currentQuestion && !showExplanation) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, currentQuestion, showExplanation]);

  // Update chatbot context when question changes (throttled)
  useEffect(() => {
    if (!loading && !generatingQuestions && currentQuestion && level) {
      const updateContext = throttle(() => {
        const context = extractQuestionContext(
          level,
          currentQuestion,
          currentQuestionIndex,
          questions.length,
          score,
          lives,
          userProfile
        );
      }, 1000); // Throttle to max 1 update per second

      updateContext();
    }
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

  // Timer effect
  useEffect(() => {
    if (
      loading ||
      gameOver ||
      levelComplete ||
      showExplanation ||
      !currentQuestion
    )
      return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentQuestionIndex,
    gameOver,
    levelComplete,
    showExplanation,
    loading,
    currentQuestion,
  ]);

  // Handle timeout
  const handleTimeout = () => {
    setLives((prevLives) => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setGameOver(true);
      }
      return newLives;
    });
    setIsAnswerCorrect(false);
    setShowExplanation(true);
  };



  // Handle hint usage
  const handleHintUsed = () => {
    setHintsRemaining(prev => Math.max(0, prev - 1));
    setUserStats(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null || showExplanation || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    // Calculate answer time for speed tracking
    const answerTime = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 60;

    const correctAnswerIndex = currentQuestion.correctIndex !== undefined
      ? currentQuestion.correctIndex
      : currentQuestion.correctAnswer;

    const isCorrect = answerIndex === correctAnswerIndex;
    setIsAnswerCorrect(isCorrect);

    // Get difficulty-based scoring config
    const diffConfig = getDifficultyConfig(level?.difficulty);

    // Track this answer for post-level review
    setAnsweredQuestions(prev => [...prev, {
      question: currentQuestion.question,
      options: currentQuestion.options,
      selectedIndex: answerIndex,
      correctIndex: correctAnswerIndex,
      isCorrect,
      explanation: currentQuestion.explanation,
      hint: currentQuestion.hint,
    }]);

    if (isCorrect) {
      playCorrect();
      // Calculate points: base + time bonus for fast answers
      const timeBonus = timeLeft > (diffConfig.timer * 0.5) ? diffConfig.timeBonus : 0;
      const pointsEarned = diffConfig.basePoints + timeBonus;
      setScore(prevScore => prevScore + pointsEarned);
      
      // Update streak
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      
      // Track fastest answer
      setFastestAnswer(prev => Math.min(prev, answerTime));
      
      // Check for mid-game achievements using session data
      try {
        const sessionCorrectSoFar = answeredQuestions.filter(q => q.isCorrect).length + 1;
        const sessionTotalSoFar = answeredQuestions.length + 1;
        const midGameStats = {
          ...userStatsRef.current,
          correctAnswers: (userStatsRef.current.correctAnswers || 0) + sessionCorrectSoFar,
          totalAnswers: (userStatsRef.current.totalAnswers || 0) + sessionTotalSoFar,
          maxStreak: Math.max(userStatsRef.current.maxStreak || 0, currentStreak + 1),
        };
        const newAchievements = checkAchievements(midGameStats, userAchievements);
        if (newAchievements.length > 0) {
          const allAch = [...userAchievements, ...newAchievements];
          setNewAchievement(newAchievements[0]);
          setUserAchievements(allAch);
          if (user?.id) {
            saveFirebaseAchievements(user.id, allAch).catch(e =>
              console.error('Error persisting mid-game achievement:', e)
            );
          }
        }
      } catch (error) {
        console.error('Error checking achievements during gameplay:', error);
      }
      
    } else {
      playWrong();
      // Wrong answer
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          playGameOver();
          setGameOver(true);
        }
        return newLives;
      });
      
      // Reset streak on wrong answer
      setCurrentStreak(0);
      
      // Check for mid-game achievements (e.g. "Brave Beginner" for first attempt)
      try {
        const sessionTotalSoFar = answeredQuestions.length + 1;
        const midGameStats = {
          ...userStatsRef.current,
          totalAnswers: (userStatsRef.current.totalAnswers || 0) + sessionTotalSoFar,
        };
        const newAchievements = checkAchievements(midGameStats, userAchievements);
        if (newAchievements.length > 0) {
          const allAch = [...userAchievements, ...newAchievements];
          setNewAchievement(newAchievements[0]);
          setUserAchievements(allAch);
          if (user?.id) {
            saveFirebaseAchievements(user.id, allAch).catch(e =>
              console.error('Error persisting mid-game achievement:', e)
            );
          }
        }
      } catch (error) {
        console.error('Error checking achievements during gameplay:', error);
      }
    }

    setShowExplanation(true);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      const diffConfig = getDifficultyConfig(level?.difficulty);
      setTimeLeft(diffConfig.timer);
      setIsAnswerCorrect(null);
      
      // Reset question timing for next question
      setQuestionStartTime(Date.now());
    } else {
      // Level completed - save progress
      completedLevel();
    }
  };

  // Render hearts for lives
  const renderLives = () => {
    return Array(3)
      .fill(0)
      .map((_, index) => (
        <HeartIcon
          key={index}
          className={`w-8 h-8 ${
            index < lives ? 'text-red-500' : 'text-gray-300'
          }`}
        />
      ));
  };

  // Calculate progress percentage
  const progressPercentage =
    (currentQuestionIndex / (questions.length || 1)) * 100;

  // If still loading or generating questions
  if (loading || generatingQuestions) {
    return generatingQuestions ? <QuestionGenerationLoader /> : <LevelLoadingSpinner />;
  }

  // If there was an error
  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4'>
        <div className='game-card p-8 text-center'>
          <XCircleIcon className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-purple-700 mb-3'>
            Oops! Something went wrong
          </h2>
          <p className='text-blue-700 mb-6'>{error}</p>
          <Link href='/game/levels'>
            <button className='btn-primary'>Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  // If no questions available
  if (!currentQuestion) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4'>
        <div className='game-card p-8 text-center'>
          <XCircleIcon className='w-16 h-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-purple-700 mb-3'>
            No Questions Available
          </h2>
          <p className='text-blue-700 mb-6'>
            We couldn't generate questions for this level. Fallback questions have been removed from the system.
          </p>
          <Link href='/game/levels'>
            <button className='btn-primary'>Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
        <div className='pt-6 px-4 pb-20'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='game-card p-6 max-w-lg mx-auto text-center'
          >
            <h2 className='text-2xl font-bold mb-4 text-purple-700'>
              Game Over!
            </h2>

            <div className='mb-6 bg-blue-50 rounded-lg p-4'>
              <h3 className='font-bold text-blue-700 mb-3'>Your Results</h3>
              <div className='flex justify-between mb-2'>
                <span className='text-blue-600'>Score:</span>
                <span className='font-bold text-purple-700'>
                  {score} points
                </span>
              </div>
              <div className='flex justify-between mb-2'>
                <span className='text-blue-600'>Questions Completed:</span>
                <span className='font-bold text-purple-700'>
                  {currentQuestionIndex} / {questions.length}
                </span>
              </div>
            </div>

            <p className='mb-6 text-blue-700'>
              Don't worry! Learning about cyber security takes practice. Try
              again!
            </p>

            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <button
                onClick={() => window.location.reload()}
                className='btn-primary w-full'
              >
                Play Again
              </button>
              <Link href='/game/levels'>
                <button className='btn-secondary w-full'>Back to Levels</button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tabs Navigation Bar */}
        <BottomNav activeTab="levels" />
      </div>
    );
  }

  // Level complete screen
  if (levelComplete) {
    const totalQuestions = questions.length;
    const correctAnswers = answeredQuestions.filter(q => q.isCorrect).length;
    const passThreshold = Math.floor(totalQuestions * 0.6);
    const passed = correctAnswers >= passThreshold;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const isPerfect = correctAnswers === totalQuestions;

    // Star rating: 1 star = passed, 2 stars = 80%+, 3 stars = perfect
    const starCount = isPerfect ? 3 : accuracy >= 80 ? 2 : passed ? 1 : 0;

    // Check if there's a next level
    const allLevels = getLevelDefinitions();
    const nextLevel = allLevels.find(l => l.id === levelId + 1);

    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
        <div className='pt-6 px-4 pb-20'>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='game-card p-6 max-w-lg mx-auto text-center'
          >
            <h2 className='text-2xl font-bold mb-2 text-purple-700'>
              {passed ? 'Mission Complete! 🎉' : 'Mission Incomplete 😢'}
            </h2>

            {/* Star Rating */}
            <div className='flex justify-center gap-1 mb-4'>
              {[1, 2, 3].map(star => (
                <motion.div
                  key={star}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + star * 0.2, type: 'spring', stiffness: 200 }}
                >
                  <StarIcon
                    className={`w-10 h-10 ${star <= starCount ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                </motion.div>
              ))}
            </div>

            <div className='mb-4 bg-blue-50 rounded-lg p-4'>
              <h3 className='font-bold text-blue-700 mb-3'>Level Results</h3>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='bg-white rounded-lg p-2'>
                  <div className='text-blue-500'>Score</div>
                  <div className='font-bold text-purple-700 text-lg'>{score}</div>
                </div>
                <div className='bg-white rounded-lg p-2'>
                  <div className='text-blue-500'>Accuracy</div>
                  <div className='font-bold text-purple-700 text-lg'>{accuracy}%</div>
                </div>
                <div className='bg-white rounded-lg p-2'>
                  <div className='text-blue-500'>Correct</div>
                  <div className='font-bold text-purple-700 text-lg'>{correctAnswers}/{totalQuestions}</div>
                </div>
                <div className='bg-white rounded-lg p-2'>
                  <div className='text-blue-500'>Best Streak</div>
                  <div className='font-bold text-purple-700 text-lg'>{maxStreak}🔥</div>
                </div>
              </div>
            </div>

            {/* Question Review Toggle */}
            {answeredQuestions.length > 0 && (
              <button
                onClick={() => setShowReview(!showReview)}
                className='mb-4 text-sm font-medium text-blue-600 hover:text-blue-800 underline'
              >
                {showReview ? 'Hide Question Review' : `Review All Questions (${answeredQuestions.length})`}
              </button>
            )}

            {/* Expandable Question Review */}
            <AnimatePresence>
              {showReview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='mb-4 text-left space-y-3 max-h-80 overflow-y-auto'
                >
                  {answeredQuestions.map((aq, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-2 text-sm ${
                        aq.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className='font-medium mb-1'>
                        {aq.isCorrect ? '✅' : '❌'} Q{idx + 1}: {aq.question}
                      </div>
                      {!aq.isCorrect && (
                        <div className='text-xs space-y-1'>
                          <div className='text-red-600'>
                            Your answer: {aq.options[aq.selectedIndex]}
                          </div>
                          <div className='text-green-600'>
                            Correct: {aq.options[aq.correctIndex]}
                          </div>
                        </div>
                      )}
                      {aq.explanation && (
                        <div className='text-xs text-gray-600 mt-1 italic'>
                          {aq.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <p className='mb-4 text-blue-700 text-sm'>
              {passed
                ? isPerfect
                  ? "Perfect score! You're a cybersecurity expert! 🏆"
                  : "Great job protecting yourself online! You've earned cyber security points!"
                : "Don't worry! Learning about cyber security takes practice. Try again!"}
            </p>

            <div className='flex flex-col gap-3'>
              {passed && nextLevel && (
                <Link href={`/game/play/${nextLevel.id}`}>
                  <button className='btn-primary w-full text-lg py-3'>
                    Next Level: {nextLevel.title} →
                  </button>
                </Link>
              )}
              <div className='flex gap-3'>
                <button
                  onClick={() => window.location.reload()}
                  className={`${passed && nextLevel ? 'btn-secondary' : 'btn-primary'} flex-1`}
                >
                  Play Again
                </button>
                <Link href='/game/levels' className='flex-1'>
                  <button className='btn-secondary w-full'>Back to Levels</button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Tabs Navigation Bar */}
        <BottomNav activeTab="levels" />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      {/* Achievement Notification */}
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
      
      {/* Decorative bubbles */}
      <div className='bubble w-20 h-20 top-20 left-10'></div>
      <div className='bubble w-16 h-16 top-40 right-10'></div>
      <div className='bubble w-24 h-24 bottom-20 left-1/3'></div>
      <div className='bubble w-12 h-12 top-1/3 right-20'></div>

      {/* Header with back button */}
      <div className='container mx-auto p-4 pb-24'>
        <div className='flex justify-between items-center mb-4'>
          <Link href='/game/levels' className='flex items-center text-blue-700 hover:text-blue-900 transition-colors'>
            <ArrowLeftIcon className='w-5 h-5 mr-1' />
            <span className="font-medium">Exit Level</span>
          </Link>
          <div className="text-center">
            <h2 className="text-lg font-bold text-purple-700">
              Level {levelId}: {level?.title}
            </h2>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Enhanced Game Stats */}
        <div className='mb-6'>
          <GameStats
            score={score}
            lives={lives}
            maxLives={3}
            timeLeft={timeLeft}
            hintsRemaining={hintsRemaining}
            streak={currentStreak}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            compact={true}
          />
        </div>

        {/* Enhanced Question Card */}
        <AnimatePresence mode='wait'>
          <div key={`question-${currentQuestionIndex}`}>
            <EnhancedQuestionCard
              question={currentQuestion?.question}
              options={currentQuestion?.options || []}
              selectedAnswer={selectedAnswer}
              correctAnswer={
                currentQuestion?.correctIndex !== undefined
                  ? currentQuestion.correctIndex
                  : currentQuestion?.correctAnswer
              }
              showExplanation={showExplanation}
              onAnswerSelect={handleAnswerSelect}
              disabled={showExplanation}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            {/* Hint System */}
            {!showExplanation && (
              <div className="mt-4">
                <HintSystem
                  question={currentQuestion}
                  onHintUsed={handleHintUsed}
                  hintsRemaining={hintsRemaining}
                  disabled={showExplanation || selectedAnswer !== null}
                />
              </div>
            )}

            {/* Enhanced Answer Feedback */}
            <AnswerFeedback
              isCorrect={isAnswerCorrect}
              explanation={currentQuestion?.explanation}
              streak={currentStreak}
              points={isAnswerCorrect ? getDifficultyConfig(level?.difficulty).basePoints + (timeLeft > getDifficultyConfig(level?.difficulty).timer * 0.5 ? getDifficultyConfig(level?.difficulty).timeBonus : 0) : 0}
              isVisible={showExplanation}
              onNext={handleNextQuestion}
            />
          </div>
        </AnimatePresence>
      </div>

      {/* Bottom Tabs Navigation Bar */}
      <BottomNav activeTab="levels" />


    </div>
  );
}
