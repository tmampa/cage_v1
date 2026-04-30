'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  ClockIcon, 
  StarIcon, 
  LightBulbIcon,
  FireIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

export default function GameStats({ 
  score = 0,
  lives = 3,
  maxLives = 3,
  timeLeft = 60,
  hintsRemaining = 3,
  streak = 0,
  questionNumber = 1,
  totalQuestions = 5,
  compact = false
}) {
  const timePercentage = (timeLeft / 60) * 100;
  const isLowTime = timeLeft <= 10;
  const isLowLives = lives <= 1;

  const StatItem = ({ icon: Icon, value, label, color = "text-blue-600", pulse = false }) => (
    <motion.div
      animate={pulse ? { scale: [1, 1.1, 1] } : {}}
      transition={pulse ? { duration: 0.5, repeat: Infinity } : {}}
      className={`flex items-center gap-2 ${compact ? 'gap-1' : 'gap-2'}`}
    >
      <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${color}`} />
      <div className="flex flex-col">
        <span className={`font-bold ${color} ${compact ? 'text-sm' : 'text-base'}`}>
          {value}
        </span>
        {!compact && (
          <span className="text-xs text-gray-500">{label}</span>
        )}
      </div>
    </motion.div>
  );

  const renderLives = () => (
    <div className="flex items-center gap-1">
      {Array(maxLives).fill(0).map((_, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <HeartIcon
            className={`w-6 h-6 ${
              index < lives 
                ? 'text-red-500' 
                : 'text-gray-300'
            } ${isLowLives && index < lives ? 'animate-pulse' : ''}`}
          />
        </motion.div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between w-full bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
        <div className="flex items-center gap-4">
          <StatItem icon={StarIcon} value={score} color="text-yellow-500" />
          <StatItem 
            icon={LightBulbIcon} 
            value={hintsRemaining} 
            color="text-blue-500" 
          />
          {streak > 0 && (
            <StatItem 
              icon={FireIcon} 
              value={streak} 
              color="text-orange-500"
              pulse={streak >= 3}
            />
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 ${isLowTime ? 'animate-pulse' : ''}`}>
            <ClockIcon className={`w-4 h-4 ${isLowTime ? 'text-red-500' : 'text-blue-500'}`} />
            <span className={`font-bold text-sm ${isLowTime ? 'text-red-500' : 'text-blue-600'}`}>
              {timeLeft}s
            </span>
          </div>
          {renderLives()}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
      {/* Top Row - Score and Lives */}
      <div className="flex items-center justify-between mb-4">
        <StatItem 
          icon={StarIcon} 
          value={score} 
          label="Score" 
          color="text-yellow-500" 
        />
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 mb-1">Lives</span>
          {renderLives()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
          />
        </div>
      </div>

      {/* Bottom Row - Timer, Hints, Streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <StatItem 
            icon={LightBulbIcon} 
            value={hintsRemaining} 
            label="Hints" 
            color="text-blue-500" 
          />
          
          {streak > 0 && (
            <StatItem 
              icon={FireIcon} 
              value={streak} 
              label="Streak" 
              color="text-orange-500"
              pulse={streak >= 3}
            />
          )}
        </div>

        {/* Timer with circular progress */}
        <div className="relative">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#E5E7EB"
              strokeWidth="4"
              fill="transparent"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke={isLowTime ? "#EF4444" : "#3B82F6"}
              strokeWidth="4"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              initial={{ strokeDashoffset: 0 }}
              animate={{ 
                strokeDashoffset: `${2 * Math.PI * 20 * (1 - timePercentage / 100)}` 
              }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${isLowTime ? 'text-red-500' : 'text-blue-600'}`}>
              {timeLeft}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}