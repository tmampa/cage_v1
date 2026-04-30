'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';

// Animated Progress Bar
export function AnimatedProgressBar({ 
  progress, 
  total, 
  label = '', 
  showPercentage = true,
  color = 'blue',
  size = 'medium'
}) {
  const percentage = Math.round((progress / total) * 100);
  
  const colors = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    orange: 'from-orange-400 to-orange-600'
  };

  const sizes = {
    small: 'h-2',
    medium: 'h-3',
    large: 'h-4'
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-purple-600">{percentage}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`${sizes[size]} bg-gradient-to-r ${colors[color]} rounded-full relative overflow-hidden`}
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.div>
      </div>
      
      {progress > 0 && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{progress} completed</span>
          <span>{total - progress} remaining</span>
        </div>
      )}
    </div>
  );
}

// Step Progress Indicator
export function StepProgress({ steps, currentStep, completedSteps = [] }) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = completedSteps.includes(stepNumber);
        const isCurrent = stepNumber === currentStep;
        const isAccessible = stepNumber <= currentStep || isCompleted;
        
        return (
          <React.Fragment key={stepNumber}>
            {/* Step Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full
                ${isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-purple-500 text-white ring-4 ring-purple-200' 
                    : isAccessible
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-200 text-gray-400'
                }
                transition-all duration-300
              `}
            >
              {isCompleted ? (
                <CheckIcon className="w-5 h-5" />
              ) : !isAccessible ? (
                <LockClosedIcon className="w-4 h-4" />
              ) : (
                <span className="text-sm font-bold">{stepNumber}</span>
              )}
              
              {/* Pulse animation for current step */}
              {isCurrent && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-purple-500 rounded-full"
                />
              )}
            </motion.div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: stepNumber < currentStep || isCompleted ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Circular Progress
export function CircularProgress({ 
  progress, 
  total, 
  size = 120, 
  strokeWidth = 8,
  color = 'purple',
  showLabel = true,
  label = ''
}) {
  const percentage = (progress / total) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    purple: '#8B5CF6',
    blue: '#3B82F6',
    green: '#10B981',
    orange: '#F59E0B'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-gray-800"
        >
          {Math.round(percentage)}%
        </motion.span>
        {showLabel && label && (
          <span className="text-xs text-gray-600 text-center">{label}</span>
        )}
      </div>
    </div>
  );
}