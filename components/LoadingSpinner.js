'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

export default function LoadingSpinner({ 
  message = "Loading...", 
  submessage = "",
  size = "large" 
}) {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8", 
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Animated Shield Icon */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }}
        className="mb-4"
      >
        <ShieldCheckIcon className={`${sizeClasses[size]} text-purple-600`} />
      </motion.div>

      {/* Loading Dots */}
      <div className="flex space-x-1 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 bg-purple-600 rounded-full"
          />
        ))}
      </div>

      {/* Messages */}
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-purple-700 mb-2 text-center"
      >
        {message}
      </motion.h2>
      
      {submessage && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-blue-700 text-center max-w-md"
        >
          {submessage}
        </motion.p>
      )}
    </div>
  );
}

// Specialized loading components for different contexts
export function QuestionGenerationLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4">
      <div className="game-card p-8 text-center max-w-lg w-full">
        <LoadingSpinner
          message="Generating Questions..."
          submessage="Our AI is creating challenging cyber security questions just for you!"
        />
      </div>
    </div>
  );
}

export function LevelLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 flex flex-col items-center justify-center p-4">
      <div className="game-card p-8 text-center max-w-lg w-full">
        <LoadingSpinner
          message="Loading Level..."
          submessage="Getting everything ready for your cyber adventure!"
        />
      </div>
    </div>
  );
}