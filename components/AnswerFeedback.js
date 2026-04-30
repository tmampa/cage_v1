'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  LightBulbIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/solid';

export default function AnswerFeedback({ 
  isCorrect, 
  explanation, 
  streak = 0,
  points = 0,
  isVisible = false,
  onNext
}) {
  const encouragementMessages = {
    correct: [
      "Excellent! 🎉",
      "Great job! 🌟", 
      "Perfect! 💯",
      "Outstanding! 🚀",
      "Brilliant! ✨"
    ],
    incorrect: [
      "Not quite, but keep learning! 💪",
      "Close! Try again next time! 🎯",
      "Learning opportunity! 📚",
      "Keep going, you've got this! 🌟",
      "Every mistake is progress! 🚀"
    ]
  };

  const getRandomMessage = (type) => {
    const messages = encouragementMessages[type];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getStreakMessage = (streak) => {
    if (streak >= 5) return "🔥 ON FIRE! Amazing streak!";
    if (streak >= 3) return "🌟 Great streak going!";
    if (streak >= 2) return "⚡ Building momentum!";
    return "";
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            mt-4 p-4 rounded-xl border-2 relative overflow-hidden
            ${isCorrect 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            }
          `}
        >
          {/* Celebration particles for correct answers */}
          {isCorrect && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1,
                    scale: 0,
                    x: '50%',
                    y: '50%'
                  }}
                  animate={{ 
                    opacity: 0,
                    scale: 1,
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Header with icon and message */}
          <div className="flex items-start gap-3 mb-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
              `}
            >
              {isCorrect ? (
                <CheckCircleIcon className="w-5 h-5 text-white" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-white" />
              )}
            </motion.div>

            <div className="flex-1">
              <motion.h4
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`
                  font-bold text-lg mb-1
                  ${isCorrect ? 'text-green-700' : 'text-red-700'}
                `}
              >
                {getRandomMessage(isCorrect ? 'correct' : 'incorrect')}
              </motion.h4>

              {/* Streak indicator */}
              {isCorrect && streak > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <FireIcon className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">
                    {getStreakMessage(streak)}
                  </span>
                </motion.div>
              )}

              {/* Points earned */}
              {isCorrect && points > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600">
                    +{points} points earned!
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <div className="flex items-start gap-2">
              <LightBulbIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation}
              </p>
            </div>
          </motion.div>

          {/* Next button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={onNext}
              className={`
                w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200
                ${isCorrect 
                  ? 'bg-green-500 hover:bg-green-600 focus:ring-green-300' 
                  : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300'
                }
                focus:outline-none focus:ring-4 focus:ring-opacity-50
                transform hover:scale-105 active:scale-95
              `}
            >
              Continue Learning! 🚀
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}