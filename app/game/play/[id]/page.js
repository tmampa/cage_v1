"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartIcon, ClockIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, StarIcon, HomeIcon, PuzzlePieceIcon, TrophyIcon, UserIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { generateQuestionsForLevel, getLevelDefinitions } from "../../../../utils/generateQuestions";
import { supabase } from "../../../../lib/supabase";
import React from "react";
import { saveLevelProgress, getLevelProgress } from "../../../../utils/gameProgress";

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
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
  const [generatingQuestions, setGeneratingQuestions] = useState(true);
  const [usingAIQuestions, setUsingAIQuestions] = useState(false);
  
  // Ref for the timer
  const timerRef = React.useRef(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
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
        const currentLevel = levelDefinitions.find(l => l.id === levelId);
        
        if (!currentLevel) {
          throw new Error(`Level with ID ${levelId} not found`);
        }
        
        setLevel(currentLevel);
        
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
          setUsingAIQuestions(true);
          
          console.log(`Generated ${generatedQuestions.length} AI questions for level ${levelId}`);
        } catch (error) {
          console.log("Could not generate AI questions, falling back to default questions:", error);
          
          // Fallback to default questions
          const defaultQuestions = [
            {
              question: "What is a strong password?",
              options: [
                "Your name and birthday",
                "A single word like 'password'",
                "A mix of letters, numbers, and symbols",
                "The same password you use everywhere"
              ],
              correctIndex: 2,
              explanation: "Strong passwords use a combination of uppercase and lowercase letters, numbers, and special characters. They should be at least 12 characters long and not contain personal information."
            },
            {
              question: "What should you do if you receive an email asking for your password?",
              options: [
                "Reply with your password",
                "Click on any links in the email",
                "Ignore it and delete the email",
                "Share the email with friends"
              ],
              correctIndex: 2,
              explanation: "Legitimate organizations will never ask for your password via email. These are phishing attempts to steal your information."
            },
            {
              question: "What is two-factor authentication?",
              options: [
                "Using two different passwords",
                "Using something you know and something you have",
                "Sharing your password with two friends",
                "Logging in twice"
              ],
              correctIndex: 1,
              explanation: "Two-factor authentication adds an extra layer of security by requiring both something you know (password) and something you have (like a code sent to your phone)."
            },
            {
              question: "Which of these is a sign of a secure website?",
              options: [
                "A padlock icon in the address bar",
                "Lots of pop-up advertisements",
                "URLs that start with 'http://'",
                "Requests for personal information"
              ],
              correctIndex: 0,
              explanation: "Secure websites use HTTPS encryption, shown by a padlock icon in the address bar. This means your data is encrypted when sent to that site."
            },
            {
              question: "What is malware?",
              options: [
                "A type of computer hardware",
                "Software that protects your computer",
                "Harmful software designed to damage or gain unauthorized access",
                "A type of strong password"
              ],
              correctIndex: 2,
              explanation: "Malware (malicious software) includes viruses, worms, trojans, and ransomware that can harm your device or steal your information."
            }
          ];
          setQuestions(defaultQuestions);
          setUsingAIQuestions(false);
        }
        
        setCurrentQuestionIndex(0);
        setScore(0);
        setLives(3);
        setGeneratingQuestions(false);
        setShowExplanation(false);
        setSelectedAnswer(null);
        setTimeLeft(30);
        setGameOver(false);
        setLevelComplete(false);
        
      } catch (error) {
        console.error("Error loading level:", error);
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
    
    setLevelComplete(true);
    
    // Save progress to Supabase
    if (user?.id) {
      try {
        await saveLevelProgress(
          user.id,
          levelId,
          score,
          passed
        );
        
        // If this level was completed successfully, we'll unlock the next level
        // (handled in the saveLevelProgress function)
        
        console.log(`Progress saved for level ${levelId}`);
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (loading || gameOver || levelComplete || showExplanation || !currentQuestion) return;

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
  }, [currentQuestionIndex, gameOver, levelComplete, showExplanation, loading, currentQuestion]);

  // Handle timeout
  const handleTimeout = () => {
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setGameOver(true);
      }
      return newLives;
    });
    setIsAnswerCorrect(false);
    setShowExplanation(true);
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswer !== null || showExplanation || !currentQuestion) return;
    
    setSelectedAnswer(answerIndex);
    
    const correctAnswerIndex = currentQuestion.correctIndex !== undefined ? 
      currentQuestion.correctIndex : currentQuestion.correctAnswer;
    
    if (answerIndex === correctAnswerIndex) {
      // Correct answer
      setScore(prevScore => prevScore + 100);
      setIsAnswerCorrect(true);
    } else {
      // Wrong answer
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
      setIsAnswerCorrect(false);
    }
    
    setShowExplanation(true);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
      setIsAnswerCorrect(null);
    } else {
      // Level completed - save progress
      completedLevel();
    }
  };

  // Render hearts for lives
  const renderLives = () => {
    return Array(3).fill(0).map((_, index) => (
      <HeartIcon 
        key={index} 
        className={`w-8 h-8 ${index < lives ? 'text-red-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex) / (questions.length || 1)) * 100;

  // If still loading or generating questions
  if (loading || generatingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4">
        <div className="game-card p-8 text-center max-w-lg w-full">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
          <h2 className="text-xl font-bold text-purple-700 mb-3">
            {generatingQuestions ? "Generating Questions..." : "Loading Level..."}
          </h2>
          <p className="text-blue-700">
            {generatingQuestions 
              ? "Our AI is creating challenging cyber security questions just for you!" 
              : "Getting everything ready for your cyber adventure!"}
          </p>
        </div>
      </div>
    );
  }

  // If there was an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4">
        <div className="game-card p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-purple-700 mb-3">Oops! Something went wrong</h2>
          <p className="text-blue-700 mb-6">{error}</p>
          <Link href="/game/levels">
            <button className="btn-primary">Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  // If no questions available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4">
        <div className="game-card p-8 text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-purple-700 mb-3">No Questions Available</h2>
          <p className="text-blue-700 mb-6">We couldn't load the questions for this level.</p>
          <Link href="/game/levels">
            <button className="btn-primary">Back to Levels</button>
          </Link>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative">
        <div className="pt-6 px-4 pb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="game-card p-6 max-w-lg mx-auto text-center"
          >
            <h2 className="text-2xl font-bold mb-4 text-purple-700">Game Over!</h2>
            
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-blue-700 mb-3">Your Results</h3>
              <div className="flex justify-between mb-2">
                <span className="text-blue-600">Score:</span>
                <span className="font-bold text-purple-700">{score} points</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-blue-600">Questions Completed:</span>
                <span className="font-bold text-purple-700">{currentQuestionIndex} / {questions.length}</span>
              </div>
            </div>
            
            <p className="mb-6 text-blue-700">
              Don't worry! Learning about cyber security takes practice. Try again!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Play Again
              </button>
              <Link href="/game/levels">
                <button className="btn-secondary w-full">Back to Levels</button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Tabs Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30">
          <div className="flex justify-around items-center">
            <Link href="/" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <HomeIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Home</span>
              </div>
            </Link>
            
            <Link href="/game/levels" className="flex-1">
              <div className="flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600">
                <PuzzlePieceIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Levels</span>
              </div>
            </Link>
            
            <Link href="/leaderboard" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <TrophyIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Leaderboard</span>
              </div>
            </Link>
            
            <Link href="/profile" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <UserIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Profile</span>
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
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative">
        <div className="pt-6 px-4 pb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="game-card p-6 max-w-lg mx-auto text-center"
          >
            <h2 className="text-2xl font-bold mb-4 text-purple-700">
              {passed ? "Mission Complete! 🎉" : "Mission Incomplete 😢"}
            </h2>
            
            <div className="mb-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-blue-700 mb-3">Level Results</h3>
              <div className="flex justify-between mb-2">
                <span className="text-blue-600">Score:</span>
                <span className="font-bold text-purple-700">{score} points</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-blue-600">Correct Answers:</span>
                <span className="font-bold text-purple-700">{correctAnswers} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Status:</span>
                <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {passed ? "PASSED" : "FAILED"}
                </span>
              </div>
            </div>
            
            <p className="mb-6 text-blue-700">
              {passed 
                ? "Great job protecting yourself online! You've earned cyber security points!" 
                : "Don't worry! Learning about cyber security takes practice. Try again!"}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Play Again
              </button>
              <Link href="/game/levels">
                <button className="btn-secondary w-full">Back to Levels</button>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Bottom Tabs Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30">
          <div className="flex justify-around items-center">
            <Link href="/" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <HomeIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Home</span>
              </div>
            </Link>
            
            <Link href="/game/levels" className="flex-1">
              <div className="flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600">
                <PuzzlePieceIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Levels</span>
              </div>
            </Link>
            
            <Link href="/leaderboard" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <TrophyIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Leaderboard</span>
              </div>
            </Link>
            
            <Link href="/profile" className="flex-1">
              <div className="flex flex-col items-center py-3 text-blue-600">
                <UserIcon className="w-6 h-6" />
                <span className="text-xs mt-1">Profile</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative">
      {/* Decorative bubbles */}
      <div className="bubble w-20 h-20 top-20 left-10"></div>
      <div className="bubble w-16 h-16 top-40 right-10"></div>
      <div className="bubble w-24 h-24 bottom-20 left-1/3"></div>
      <div className="bubble w-12 h-12 top-1/3 right-20"></div>

      {/* Header with back button and game info */}
      <div className="container mx-auto p-4 pb-24">
        <div className="flex justify-between items-center mb-4">
          <Link href="/game/levels" className="flex items-center text-blue-700">
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            <span>Exit Level</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-500 mr-1" />
              <span className="font-bold">{score}</span>
            </div>
            <div className="flex items-center">{renderLives()}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Level {levelId}: {level && level.title}</span>
            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
          </div>
          <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Timer */}
        <div className="mb-4 flex justify-end">
          <div className={`flex items-center py-1 px-3 rounded-full ${
            timeLeft <= 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
          }`}>
            <ClockIcon className="w-5 h-5" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`question-${currentQuestionIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="game-card p-5 mb-4"
          >
            <h3 className="text-xl font-bold mb-4 text-blue-800">{currentQuestion?.question}</h3>
            
            {/* Answer options */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => {
                const correctAnswerIndex = currentQuestion.correctIndex !== undefined ? 
                  currentQuestion.correctIndex : currentQuestion.correctAnswer;
                
                return (
                  <motion.button
                    key={`option-${index}`}
                    variants={itemVariants}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      showExplanation
                        ? index === correctAnswerIndex
                          ? 'bg-green-100 border-2 border-green-500 text-green-800'
                          : index === selectedAnswer
                            ? 'bg-red-100 border-2 border-red-500 text-red-800'
                            : 'bg-white text-blue-700 border border-gray-200'
                        : selectedAnswer === index
                          ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                          : 'bg-white hover:bg-blue-50 text-blue-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                        showExplanation
                          ? index === correctAnswerIndex
                            ? 'bg-green-500 text-white'
                            : index === selectedAnswer
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {['A', 'B', 'C', 'D'][index]}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
            
            {/* Answer explanation */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-lg bg-blue-50"
              >
                <div className="flex items-start">
                  {isAnswerCorrect ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-bold mb-1 ${isAnswerCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      {isAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                    </h4>
                    <p className="text-sm text-blue-700">{currentQuestion.explanation}</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleNextQuestion}
                  className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Level'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom Tabs Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30">
        <div className="flex justify-around items-center">
          <Link href="/" className="flex-1">
            <div className="flex flex-col items-center py-3 text-blue-600">
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </div>
          </Link>
          
          <Link href="/game/levels" className="flex-1">
            <div className="flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600">
              <PuzzlePieceIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Levels</span>
            </div>
          </Link>
          
          <Link href="/leaderboard" className="flex-1">
            <div className="flex flex-col items-center py-3 text-blue-600">
              <TrophyIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Leaderboard</span>
            </div>
          </Link>
          
          <Link href="/profile" className="flex-1">
            <div className="flex flex-col items-center py-3 text-blue-600">
              <UserIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
