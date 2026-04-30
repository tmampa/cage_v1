'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function EnhancedQuestionCard({ 
  question,
  options = [],
  selectedAnswer = null,
  correctAnswer = null,
  showExplanation = false,
  onAnswerSelect,
  disabled = false,
  questionNumber = 1,
  totalQuestions = 1
}) {
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

  const getOptionStyle = (index) => {
    if (!showExplanation) {
      return selectedAnswer === index
        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 shadow-md'
        : 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-md';
    }

    if (index === correctAnswer) {
      return 'bg-green-100 border-2 border-green-500 text-green-800 shadow-md';
    }
    
    if (index === selectedAnswer && selectedAnswer !== correctAnswer) {
      return 'bg-red-100 border-2 border-red-500 text-red-800 shadow-md';
    }
    
    return 'bg-gray-50 text-gray-600 border border-gray-200';
  };

  const getOptionIcon = (index) => {
    if (!showExplanation) return null;
    
    if (index === correctAnswer) {
      return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    }
    
    if (index === selectedAnswer && selectedAnswer !== correctAnswer) {
      return <XCircleIcon className="w-5 h-5 text-red-600" />;
    }
    
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="game-card p-6 shadow-lg"
    >
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < questionNumber - 1
                    ? 'bg-green-500'
                    : i === questionNumber - 1
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-gray-800 leading-relaxed"
        >
          {question}
        </motion.h3>
      </div>

      {/* Answer Options */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
          
          return (
            <motion.button
              key={`option-${index}`}
              variants={itemVariants}
              onClick={() => !disabled && onAnswerSelect(index)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02, x: 4 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className={`
                w-full p-4 rounded-xl text-left transition-all duration-200
                ${getOptionStyle(index)}
                ${disabled ? 'cursor-default' : 'cursor-pointer'}
                group relative overflow-hidden
              `}
            >
              {/* Background animation on hover */}
              {!disabled && !showExplanation && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  layoutId={`hover-bg-${index}`}
                />
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                {/* Option Letter */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${showExplanation
                    ? index === correctAnswer
                      ? 'bg-green-500 text-white'
                      : index === selectedAnswer && selectedAnswer !== correctAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                    : selectedAnswer === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 group-hover:bg-blue-200'
                  }
                  transition-colors duration-200
                `}>
                  {optionLetter}
                </div>

                {/* Option Text */}
                <span className="flex-1 font-medium leading-relaxed">
                  {option}
                </span>

                {/* Result Icon */}
                {getOptionIcon(index)}
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Visual feedback for selection */}
      <AnimatePresence>
        {selectedAnswer !== null && !showExplanation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Processing your answer...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}