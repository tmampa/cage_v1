'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  LockClosedIcon, 
  StarIcon, 
  CheckIcon,
  PlayIcon,
  ClockIcon,
  TrophyIcon
} from '@heroicons/react/24/solid';

export default function LevelMap({ levels, userProgress = {} }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const levelVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      },
    },
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  // Calculate positions for levels in a winding path
  const getLevelPosition = (index) => {
    const positions = [
      { x: 20, y: 85 },  // Level 1 - bottom left
      { x: 35, y: 65 },  // Level 2
      { x: 65, y: 70 },  // Level 3
      { x: 80, y: 45 },  // Level 4
      { x: 60, y: 25 },  // Level 5
      { x: 30, y: 15 },  // Level 6 - top
    ];
    return positions[index] || { x: 50, y: 50 };
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-300 rounded-full blur-xl"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-purple-300 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-green-300 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 right-10 w-18 h-18 bg-yellow-300 rounded-full blur-xl"></div>
      </div>

      {/* Animated Path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          d="M 20 85 Q 30 75 35 65 Q 50 60 65 70 Q 75 55 80 45 Q 70 35 60 25 Q 45 20 30 15"
          stroke="url(#pathGradient)"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="2,2"
        />
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Level Nodes */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full h-full"
      >
        {levels.map((level, index) => {
          const position = getLevelPosition(index);
          const isUnlocked = level.unlocked;
          const isCompleted = level.completed;
          const userScore = level.userScore || 0;
          
          const LevelNode = ({ children }) => {
            if (isUnlocked) {
              return (
                <Link 
                  href={`/game/play/${level.id}`}
                  className="block"
                >
                  {children}
                </Link>
              );
            }
            return <div className="block">{children}</div>;
          };
          
          return (
            <motion.div
              key={level.id}
              variants={levelVariants}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${position.x}%`, 
                top: `${position.y}%` 
              }}
            >
              {/* Level Node */}
              <div className="relative group">
                {/* Glow Effect for Unlocked Levels */}
                {isUnlocked && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`absolute inset-0 rounded-full blur-md pointer-events-none ${
                      isCompleted ? 'bg-green-400' : 'bg-blue-400'
                    }`}
                    style={{ transform: 'scale(1.5)' }}
                  />
                )}

                {/* Pulse effect for better click indication */}
                {isUnlocked && !isCompleted && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0, 0.4, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute inset-0 rounded-full border-2 border-yellow-400 pointer-events-none"
                    style={{ transform: 'scale(1.2)' }}
                  />
                )}

                {/* Main Level Circle */}
                <LevelNode>
                  <motion.div
                    whileHover={isUnlocked ? { scale: 1.1 } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    onClick={() => {
                      if (isUnlocked) {
                        console.log(`Clicked on level ${level.id}: ${level.title}`);
                      }
                    }}
                    className={`
                      relative w-20 h-20 rounded-full flex items-center justify-center
                      border-4 transition-all duration-300 z-10
                      ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 shadow-lg shadow-green-200 hover:shadow-2xl hover:shadow-green-300' 
                        : isUnlocked 
                          ? `bg-gradient-to-br ${level.color} border-white shadow-lg shadow-blue-200 hover:shadow-xl hover:border-yellow-300`
                          : 'bg-gray-300 border-gray-400 shadow-md'
                      }
                    `}
                  >
                    {/* Level Icon */}
                    <span className={`text-2xl transition-all duration-200 ${
                      isUnlocked 
                        ? 'drop-shadow-sm hover:scale-110' 
                        : 'grayscale opacity-50'
                    }`}>
                      {level.icon}
                    </span>

                    {/* Click indicator for unlocked levels */}
                    {isUnlocked && (
                      <>
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileHover={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 rounded-full border-2 border-yellow-400 border-dashed animate-pulse"
                        />
                        
                        {/* Click to play tooltip */}
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          whileHover={{ opacity: 1, y: 0 }}
                          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
                        >
                          Click to play!
                        </motion.div>
                      </>
                    )}

                    {/* Lock Icon for Locked Levels */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-full">
                        <LockClosedIcon className="w-6 h-6 text-white drop-shadow-sm" />
                      </div>
                    )}

                    {/* Completion Badge */}
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-lg pointer-events-none"
                      >
                        <CheckIcon className="w-4 h-4 text-white" />
                      </motion.div>
                    )}

                    {/* Level Number */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 shadow-sm pointer-events-none">
                      <span className="text-xs font-bold text-gray-700">{level.id}</span>
                    </div>
                  </motion.div>
                </LevelNode>

                {/* Level Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-24 left-1/2 transform -translate-x-1/2 w-64 pointer-events-none group-hover:pointer-events-auto z-20"
                >
                  <div className="game-card p-4 shadow-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-800 text-sm">{level.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(level.difficulty)}`}>
                        {level.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                      {level.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <TrophyIcon className="w-3 h-3 text-yellow-500" />
                        <span className="text-gray-600">{level.points} pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-blue-500" />
                        <span className="text-gray-600">{level.questions} questions</span>
                      </div>
                    </div>

                    {isCompleted && userScore > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-medium">Completed!</span>
                          <span className="text-gray-600">Score: {userScore}</span>
                        </div>
                      </div>
                    )}

                    {isUnlocked && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <Link href={`/game/play/${level.id}`}>
                          <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1 pointer-events-auto">
                            <PlayIcon className="w-3 h-3" />
                            {isCompleted ? 'Play Again' : 'Start Level'}
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute top-4 right-4 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
            className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-60"
          />
        ))}
      </div>
    </div>
  );
}