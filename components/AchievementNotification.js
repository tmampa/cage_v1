'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrophyIcon, 
  XMarkIcon,
  StarIcon 
} from '@heroicons/react/24/solid';

export default function AchievementNotification({ 
  achievement, 
  onClose, 
  autoClose = true,
  autoCloseDelay = 4000 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && achievement) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [achievement, autoClose, autoCloseDelay, onClose]);

  if (!achievement || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.8 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
      >
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-2xl p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {/* Achievement Icon */}
              <div className="bg-white bg-opacity-20 rounded-full p-2 flex-shrink-0">
                <span className="text-2xl">{achievement.icon}</span>
              </div>
              
              {/* Achievement Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TrophyIcon className="w-4 h-4 text-yellow-200" />
                  <span className="text-xs font-medium text-yellow-100 uppercase tracking-wide">
                    Achievement Unlocked!
                  </span>
                </div>
                
                <h3 className="font-bold text-lg leading-tight mb-1">
                  {achievement.title}
                </h3>
                
                <p className="text-sm text-yellow-100 leading-tight mb-2">
                  {achievement.description}
                </p>
                
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-yellow-200" />
                  <span className="text-sm font-medium">
                    +{achievement.points} points
                  </span>
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white hover:text-yellow-200 transition-colors flex-shrink-0 ml-2"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Celebration particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 1, 
                scale: 0,
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50
              }}
              animate={{ 
                opacity: 0, 
                scale: 1,
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Achievement List Component for Profile/Settings
export function AchievementsList({ achievements, userStats }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-purple-700 mb-4">Achievements</h3>
      
      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-3 rounded-lg border transition-all ${
              achievement.isEarned
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`text-2xl ${achievement.isEarned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium ${achievement.isEarned ? 'text-orange-800' : 'text-gray-600'}`}>
                    {achievement.title}
                  </h4>
                  {achievement.isEarned && (
                    <TrophyIcon className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <p className={`text-sm ${achievement.isEarned ? 'text-orange-600' : 'text-gray-500'}`}>
                  {achievement.description}
                </p>
                
                {/* Progress Bar for unearned achievements */}
                {!achievement.isEarned && achievement.progress > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {achievement.isEarned && (
                  <div className="flex items-center gap-2 mt-1">
                    <StarIcon className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-orange-600 font-medium">
                      +{achievement.points} points
                    </span>
                    {achievement.earnedAt && (
                      <span className="text-xs text-gray-500">
                        • {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}