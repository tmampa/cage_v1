"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartIcon, ClockIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, StarIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export default function GameplayPage({ params }) {
  const router = useRouter();
  const { id } = params;
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);

  // Mock questions for the level
  const questions = [
    {
      question: "What is a strong password?",
      options: [
        "Your name and birthday",
        "A single word like 'password'",
        "A mix of letters, numbers, and symbols",
        "The same password you use everywhere"
      ],
      correctAnswer: 2,
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
      correctAnswer: 2,
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
      correctAnswer: 1,
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
      correctAnswer: 0,
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
      correctAnswer: 2,
      explanation: "Malware (malicious software) includes viruses, worms, trojans, and ransomware that can harm your device or steal your information."
    }
  ];

  // Current question
  const currentQuestion = questions[currentQuestionIndex];

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

  // Timer effect
  useEffect(() => {
    if (gameOver || levelComplete || showExplanation) return;

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
  }, [currentQuestionIndex, gameOver, levelComplete, showExplanation]);

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
    if (selectedAnswer !== null || showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    
    if (answerIndex === currentQuestion.correctAnswer) {
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
      // Level completed
      setLevelComplete(true);
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
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 p-4 overflow-hidden">
      {/* Decorative bubbles */}
      <div className="bubble w-20 h-20 top-20 left-10"></div>
      <div className="bubble w-16 h-16 top-40 right-10"></div>
      <div className="bubble w-24 h-24 bottom-20 left-1/3"></div>
      <div className="bubble w-12 h-12 top-1/3 right-20"></div>

      {/* Header with back button and game info */}
      <div className="container mx-auto mb-4">
        <Link href="/game/levels" className="inline-flex items-center text-blue-700 hover:text-blue-900">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Back to Levels</span>
        </Link>
        
        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-1">
            {renderLives()}
          </div>
          <div className="bg-white px-4 py-2 rounded-full font-bold text-purple-600 shadow-md">
            Score: {score}
          </div>
          <motion.div 
            className="flex items-center bg-white px-4 py-2 rounded-full shadow-md"
            animate={{
              scale: timeLeft <= 5 ? [1, 1.1, 1] : 1
            }}
            transition={{
              duration: 0.5,
              repeat: timeLeft <= 5 ? Infinity : 0,
              repeatType: "loop"
            }}
          >
            <ClockIcon className={`w-5 h-5 mr-2 ${timeLeft <= 5 ? 'text-red-500' : 'text-yellow-500'}`} />
            <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 mb-4">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-center text-sm mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* Game content */}
      <div className="container mx-auto">
        {!gameOver && !levelComplete ? (
          <motion.div 
            className="game-card p-6 border-4 border-yellow-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Question */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-purple-600 mb-4">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Answer options */}
            <motion.div 
              className="space-y-4 mb-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  variants={itemVariants}
                  whileHover={selectedAnswer === null && !showExplanation ? { scale: 1.02 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null || showExplanation}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedAnswer === null && !showExplanation
                      ? 'bg-white hover:bg-blue-50 shadow-md' 
                      : selectedAnswer === index
                        ? index === currentQuestion.correctAnswer
                          ? 'bg-green-100 border-2 border-green-500 shadow-lg'
                          : 'bg-red-100 border-2 border-red-500 shadow-lg'
                        : index === currentQuestion.correctAnswer && showExplanation
                          ? 'bg-green-100 border-2 border-green-500 shadow-lg'
                          : 'bg-white opacity-70'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 mr-3 font-bold">{String.fromCharCode(65 + index)}</span>
                    <span className="text-lg">{option}</span>
                    {showExplanation && index === currentQuestion.correctAnswer && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 ml-auto" />
                    )}
                    {showExplanation && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                      <XCircleIcon className="w-6 h-6 text-red-500 ml-auto" />
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Explanation */}
            {showExplanation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`p-4 rounded-xl mb-6 ${isAnswerCorrect ? 'bg-green-50 border-l-4 border-green-500' : 'bg-blue-50 border-l-4 border-blue-500'}`}
              >
                <h3 className="font-bold text-blue-800 mb-2">
                  {isAnswerCorrect ? '🎉 Correct! ' : '📝 Learning Opportunity: '}
                </h3>
                <p>{currentQuestion.explanation}</p>
              </motion.div>
            )}

            {/* Next button */}
            {showExplanation && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                onClick={handleNextQuestion}
                className="btn-primary w-full py-3"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Level'}
              </motion.button>
            )}
          </motion.div>
        ) : gameOver ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="game-card p-8 text-center border-4 border-red-400"
          >
            <h2 className="text-3xl font-bold text-red-600 mb-4">Game Over!</h2>
            <p className="text-lg mb-6">You ran out of lives. Better luck next time!</p>
            <div className="bg-red-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">😢</span>
            </div>
            <p className="text-xl font-bold mb-8">Your score: {score}</p>
            <Link href="/game/levels">
              <button className="btn-primary">Try Again</button>
            </Link>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="game-card p-8 text-center border-4 border-green-400"
          >
            <h2 className="text-3xl font-bold text-green-600 mb-4">Level Complete!</h2>
            <div className="bg-green-50 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🏆</span>
            </div>
            <p className="text-lg mb-4">Great job! You've completed this level.</p>
            
            {/* Stars earned */}
            <div className="flex justify-center mb-6">
              <StarIcon className="w-10 h-10 text-yellow-400" />
              <StarIcon className="w-10 h-10 text-yellow-400" />
              <StarIcon className="w-10 h-10 text-yellow-400" />
            </div>
            
            <p className="text-xl font-bold mb-8">Your score: {score}</p>
            <div className="flex flex-col space-y-4">
              <Link href="/game/levels">
                <button className="btn-primary">Back to Levels</button>
              </Link>
              <Link href="/">
                <button className="btn-secondary">
                  Home
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
