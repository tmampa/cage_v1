'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  LockClosedIcon, 
  LockOpenIcon, 
  StarIcon, 
  CheckIcon,
  ClockIcon,
  PlayIcon
} from '@heroicons/react/24/solid';

export default function EnhancedLevelCard({ 
  level, 
  isUnlocked = false, 
  isCompleted = false,
  userScore = 0,
  bestTime = null,
  className = ''
}) {
  const difficultyColors = {
    Easy: 'from-green-400 to-green-600',
    Medium: 'from-yellow-400 to-yellow-600', 
    Hard: 'from-red-400 to-red-600'
  };

  const difficultyIcons = {
    Easy: '⭐',
    Medium: '⭐⭐', 
    Hard: '⭐⭐⭐'
  };

  return (
    <motion.div
      whileHover={{ y: isUnlocked ? -8 : 0, scale: isUnlocked ? 1.02 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.98 : 1 }}
      className={`
        game-card overflow-hidden shadow-lg relative
        ${!isUnlocked ? 'opacity-75' : ''}
        ${className}
      `}
    >
      {/* Completion Badge */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full p-1.5 shadow-lg"
        >
          <CheckIcon className="w-4 h-4" />
        </motion.div>
      )}

      {/* Header with gradient and icon */}
      <div className={`bg-gradient-to-r ${level.color} p-4 text-white relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <motion.span 
              className="text-4xl drop-shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {level.icon}
            </motion.span>
            
            <div className="flex items-center gap-2">
              {/* Difficulty indicator */}
              <div className="bg-white/20 rounded-full px-2 py-1">
                <span className="text-xs font-medium">{difficultyIcons[level.difficulty]}</span>
              </div>
              
              {/* Lock/Unlock indicator */}
              <div className="bg-white/20 rounded-full p-1.5">
                {isUnlocked ? (
                  <LockOpenIcon className="w-4 h-4" />
                ) : (
                  <LockClosedIcon className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-1 line-clamp-1">
            {level.title}
          </h3>
          
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>{level.questions} questions</span>
            <span>•</span>
            <span>{level.points} pts</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {level.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Difficulty:</span>
              <span className={`font-medium ${
                level.difficulty === 'Easy' ? 'text-green-600' :
                level.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {level.difficulty}
              </span>
            </div>
          </div>
          
          {isCompleted && (
            <div className="flex items-center gap-3">
              {userScore > 0 && (
                <div className="flex items-center gap-1">
                  <StarIcon className="w-3 h-3 text-yellow-500" />
                  <span className="font-medium text-gray-700">{userScore}</span>
                </div>
              )}
              {bestTime && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-blue-500" />
                  <span className="font-medium text-gray-700">{bestTime}s</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        {isUnlocked ? (
          <Link href={`/game/play/${level.id}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200
                flex items-center justify-center gap-2
                ${isCompleted 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                  : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700'
                }
                focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
              `}
            >
              <PlayIcon className="w-4 h-4" />
              {isCompleted ? 'Play Again' : 'Start Level'}
            </motion.button>
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-3 px-4 rounded-lg font-bold text-gray-400 bg-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LockClosedIcon className="w-4 h-4" />
            Complete Previous Level
          </button>
        )}
      </div>

      {/* Progress indicator for completed levels */}
      {isCompleted && userScore > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((userScore / level.points) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          />
        </div>
      )}
    </motion.div>
  );
}