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
import FeedbackButton from '../../../../components/FeedbackButton';
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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React from 'react';
import { extractQuestionContext, throttle } from '../../../../utils/chatbotContext';

// Save level progress to Firebase
const saveLevelProgress = async (userId, levelId, score, passed) => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${levelId}`);
    const progressData = {
      userId,
      levelId,
      score,
      passed,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if document exists
    const docSnap = await getDoc(progressRef);
    const isNewHighScore =
      !docSnap.exists() || (docSnap.exists() && docSnap.data().score < score);

    if (docSnap.exists()) {
      // Only update if new score is higher
      if (isNewHighScore) {
        await updateDoc(progressRef, progressData);
      }
    } else {
      // Create new document
      await setDoc(progressRef, {
        ...progressData,
        createdAt: new Date().toISOString(),
      });
    }

    // Update user's total score and highest level in their profile
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      let totalScore = userData.score || 0;
      const currentHighestLevel = userData.highestLevel || 0;

      // If this is a new high score for the level, update the total score
      if (isNewHighScore) {
        // If there was a previous score for this level, subtract it
        if (docSnap.exists()) {
          totalScore -= docSnap.data().score;
        }
        // Add the new score
        totalScore += score;
      }

      // Update user profile with new total score and highest level if applicable
      await updateDoc(userRef, {
        score: totalScore,
        highestLevel: passed
          ? Math.max(currentHighestLevel, levelId)
          : currentHighestLevel,
        updatedAt: new Date().toISOString(),
      });

      // Update leaderboard
      const leaderboardRef = doc(db, 'leaderboard', userId);
      await setDoc(
        leaderboardRef,
        {
          userId,
          username: userData.username,
          score: totalScore,
          avatar_emoji: userData.avatar_emoji || '👤',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

// Get level progress from Firebase
const getLevelProgress = async (userId, levelId) => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${levelId}`);
    const docSnap = await getDoc(progressRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }

    return null;
  } catch (error) {
    console.error('Error getting progress:', error);
    throw error;
  }
};

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

  // Ref for the timer
  const timerRef = React.useRef(null);

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
          userProgress = await getLevelProgress(user.id, levelId);
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
        setTimeLeft(60);
        setGameOver(false);
        setLevelComplete(false);
        
        // Initialize enhancement states
        setHintsRemaining(3);
        setCurrentStreak(0);
        setMaxStreak(0);
        setFastestAnswer(Infinity);
        setQuestionStartTime(Date.now());

        // Initialize user stats based on actual progress
        if (user?.id && userProfile) {
          const currentScore = userProfile.score || 0;
          const estimatedLevelsCompleted = Math.floor(currentScore / 100); // Rough estimate
          const estimatedCorrectAnswers = estimatedLevelsCompleted * 5; // Estimate 5 questions per level
          
          const initialStats = {
            ...DEFAULT_USER_STATS,
            levelsCompleted: estimatedLevelsCompleted,
            correctAnswers: estimatedCorrectAnswers,
            totalAnswers: estimatedCorrectAnswers + Math.floor(estimatedCorrectAnswers * 0.2), // Add some wrong answers
            perfectScores: Math.floor(estimatedLevelsCompleted * 0.3), // Estimate some perfect scores
          };
          
          setUserStats(initialStats);
          console.log('Initialized user stats:', initialStats);

          // Load existing achievements from localStorage
          try {
            const savedAchievements = localStorage.getItem(`achievements_${user.id}`);
            if (savedAchievements) {
              const achievements = JSON.parse(savedAchievements);
              setUserAchievements(achievements);
              console.log('Loaded existing achievements:', achievements);
            }
          } catch (storageError) {
            console.warn('Could not load achievements from localStorage:', storageError);
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
    const correctAnswers = Math.floor(score / 100);
    const totalQuestions = questions.length;
    const passThreshold = Math.floor(totalQuestions * 0.6); // 60% correct to pass
    const passed = correctAnswers >= passThreshold;
    const isPerfectScore = correctAnswers === totalQuestions;

    setLevelComplete(true);

    // Update final user stats for achievement checking
    const finalStats = {
      ...userStats,
      levelsCompleted: passed ? userStats.levelsCompleted + 1 : userStats.levelsCompleted,
      perfectScores: isPerfectScore ? userStats.perfectScores + 1 : userStats.perfectScores,
      noHintLevels: hintsRemaining === 3 && passed ? userStats.noHintLevels + 1 : userStats.noHintLevels
    };

    // Update the user stats state
    setUserStats(finalStats);

    // Check for new achievements
    try {
      console.log('Checking achievements with stats:', finalStats);
      console.log('Current user achievements:', userAchievements);
      
      const newAchievements = checkAchievements(finalStats, userAchievements);
      if (newAchievements.length > 0) {
        // Show the first new achievement
        setNewAchievement(newAchievements[0]);
        // Add to user achievements
        setUserAchievements(prev => [...prev, ...newAchievements]);
        console.log('New achievements earned:', newAchievements);
        
        // Save achievements to localStorage for persistence
        try {
          const savedAchievements = [...userAchievements, ...newAchievements];
          localStorage.setItem(`achievements_${user?.id}`, JSON.stringify(savedAchievements));
        } catch (storageError) {
          console.warn('Could not save achievements to localStorage:', storageError);
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
        await saveLevelProgress(user.id, levelId, score, passed);

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

    if (isCorrect) {
      // Correct answer
      setScore(prevScore => prevScore + 100);
      
      // Update streak
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(current => Math.max(current, newStreak));
        return newStreak;
      });
      
      // Track fastest answer
      setFastestAnswer(prev => Math.min(prev, answerTime));
      
      // Update user stats
      setUserStats(prev => {
        const newStats = {
          ...prev,
          correctAnswers: prev.correctAnswers + 1,
          totalAnswers: prev.totalAnswers + 1,
          maxStreak: Math.max(prev.maxStreak, currentStreak + 1),
          fastestAnswer: Math.min(prev.fastestAnswer, answerTime)
        };
        console.log('Updated stats after correct answer:', newStats);
        
        // Check for achievements immediately
        try {
          const newAchievements = checkAchievements(newStats, userAchievements);
          if (newAchievements.length > 0) {
            setNewAchievement(newAchievements[0]);
            setUserAchievements(prev => [...prev, ...newAchievements]);
            console.log('🏆 Achievement earned during gameplay:', newAchievements[0]);
          }
        } catch (error) {
          console.error('Error checking achievements during gameplay:', error);
        }
        
        return newStats;
      });
      
    } else {
      // Wrong answer
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
      
      // Reset streak on wrong answer
      setCurrentStreak(0);
      
      // Update user stats
      setUserStats(prev => {
        const newStats = {
          ...prev,
          totalAnswers: prev.totalAnswers + 1
        };
        console.log('Updated stats after wrong answer:', newStats);
        
        // Check for achievements (like "Brave Beginner" for first attempt)
        try {
          const newAchievements = checkAchievements(newStats, userAchievements);
          if (newAchievements.length > 0) {
            setNewAchievement(newAchievements[0]);
            setUserAchievements(prev => [...prev, ...newAchievements]);
            console.log('🏆 Achievement earned during gameplay:', newAchievements[0]);
          }
        } catch (error) {
          console.error('Error checking achievements during gameplay:', error);
        }
        
        return newStats;
      });
    }

    setShowExplanation(true);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(60);
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
        <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
          <div className='flex justify-around items-center'>
            <Link href='/game/levels' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <HomeIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Home</span>
              </div>
            </Link>

            <Link href='/game/levels' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600'>
                <PuzzlePieceIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Levels</span>
              </div>
            </Link>

            <Link href='/leaderboard' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <TrophyIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Leaderboard</span>
              </div>
            </Link>

            <Link href='/profile' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <UserIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Level complete screen
  if (levelComplete) {
    const totalQuestions = questions.length;
    const correctAnswers = Math.floor(score / 100);
    const passThreshold = Math.floor(totalQuestions * 0.6);
    const passed = correctAnswers >= passThreshold;

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
              {passed ? 'Mission Complete! 🎉' : 'Mission Incomplete 😢'}
            </h2>

            <div className='mb-6 bg-blue-50 rounded-lg p-4'>
              <h3 className='font-bold text-blue-700 mb-3'>Level Results</h3>
              <div className='flex justify-between mb-2'>
                <span className='text-blue-600'>Score:</span>
                <span className='font-bold text-purple-700'>
                  {score} points
                </span>
              </div>
              <div className='flex justify-between mb-2'>
                <span className='text-blue-600'>Correct Answers:</span>
                <span className='font-bold text-purple-700'>
                  {correctAnswers} / {totalQuestions}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-blue-600'>Status:</span>
                <span
                  className={`font-bold ${
                    passed ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>

            <p className='mb-6 text-blue-700'>
              {passed
                ? "Great job protecting yourself online! You've earned cyber security points!"
                : "Don't worry! Learning about cyber security takes practice. Try again!"}
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
        <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
          <div className='flex justify-around items-center'>
            <Link href='/' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <HomeIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Home</span>
              </div>
            </Link>

            <Link href='/game/levels' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600'>
                <PuzzlePieceIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Levels</span>
              </div>
            </Link>

            <Link href='/leaderboard' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <TrophyIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Leaderboard</span>
              </div>
            </Link>

            <Link href='/profile' className='flex-1'>
              <div className='flex flex-col items-center py-3 text-blue-600'>
                <UserIcon className='w-6 h-6' />
                <span className='text-xs mt-1'>Profile</span>
              </div>
            </Link>
          </div>
        </div>
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
              points={isAnswerCorrect ? 100 : 0}
              isVisible={showExplanation}
              onNext={handleNextQuestion}
            />
          </div>
        </AnimatePresence>
      </div>

      {/* Bottom Tabs Navigation Bar */}
      <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
        <div className='flex justify-around items-center'>
          <Link href='/' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <HomeIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Home</span>
            </div>
          </Link>

          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600'>
              <PuzzlePieceIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Levels</span>
            </div>
          </Link>

          <Link href='/leaderboard' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <TrophyIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Leaderboard</span>
            </div>
          </Link>

          <Link href='/profile' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <UserIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Profile</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
