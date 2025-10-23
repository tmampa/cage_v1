'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LightBulbIcon, 
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/solid';

export default function HintSystem({ 
  question, 
  onHintUsed, 
  hintsRemaining = 3,
  disabled = false 
}) {
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const handleUseHint = () => {
    if (disabled || hintsRemaining <= 0 || hintUsed) return;
    
    setShowHint(true);
    setHintUsed(true);
    onHintUsed();
  };

  const toggleHintVisibility = () => {
    setShowHint(!showHint);
  };

  // Generate a hint based on the question and correct answer
  const generateHint = () => {
    if (!question || !question.options) return "Think carefully about the safest option.";
    
    const correctOption = question.options[question.correctIndex];
    
    // Create a hint by giving a clue about the correct answer
    if (correctOption.toLowerCase().includes('password')) {
      return "💡 Think about what makes passwords secure and hard to guess.";
    } else if (correctOption.toLowerCase().includes('email') || correctOption.toLowerCase().includes('phishing')) {
      return "💡 Consider what signs indicate a suspicious or fake email.";
    } else if (correctOption.toLowerCase().includes('https') || correctOption.toLowerCase().includes('secure')) {
      return "💡 Look for security indicators that show a website is safe.";
    } else if (correctOption.toLowerCase().includes('update') || correctOption.toLowerCase().includes('software')) {
      return "💡 Think about keeping your software current and protected.";
    } else if (correctOption.toLowerCase().includes('share') || correctOption.toLowerCase().includes('private')) {
      return "💡 Consider what information should be kept private online.";
    } else {
      return "💡 Think about which option prioritizes safety and security.";
    }
  };

  return (
    <div className="hint-system">
      {/* Hint Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleUseHint}
        disabled={disabled || hintsRemaining <= 0 || hintUsed}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          disabled || hintsRemaining <= 0 || hintUsed
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
        }`}
      >
        <LightBulbIcon className="w-4 h-4" />
        {hintUsed ? 'Hint Used' : `Hint (${hintsRemaining} left)`}
      </motion.button>

      {/* Hint Display */}
      <AnimatePresence>
        {hintUsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <LightBulbIcon className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Hint</span>
                  <button
                    onClick={toggleHintVisibility}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                  >
                    {showHint ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {showHint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-yellow-700"
                  >
                    {generateHint()}
                  </motion.p>
                )}
                
                {!showHint && (
                  <p className="text-xs text-yellow-600">
                    Click the eye icon to reveal your hint
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}