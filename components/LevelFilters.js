'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FunnelIcon,
  StarIcon,
  CheckIcon,
  LockClosedIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid';
import EnhancedButton from './EnhancedButton';

export default function LevelFilters({ 
  levels, 
  onFilterChange, 
  activeFilters = { difficulty: 'all', status: 'all', sort: 'order' }
}) {
  const [showFilters, setShowFilters] = useState(false);

  const difficulties = ['all', 'Easy', 'Medium', 'Hard'];
  const statuses = [
    { key: 'all', label: 'All Levels', icon: '📚' },
    { key: 'unlocked', label: 'Unlocked', icon: '🔓' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'locked', label: 'Locked', icon: '🔒' }
  ];
  const sortOptions = [
    { key: 'order', label: 'Level Order' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'points', label: 'Points' }
  ];

  const handleFilterChange = (type, value) => {
    onFilterChange({
      ...activeFilters,
      [type]: value
    });
  };

  const getFilteredCount = () => {
    return levels.filter(level => {
      const difficultyMatch = activeFilters.difficulty === 'all' || level.difficulty === activeFilters.difficulty;
      const statusMatch = activeFilters.status === 'all' || 
        (activeFilters.status === 'unlocked' && level.unlocked) ||
        (activeFilters.status === 'completed' && level.completed) ||
        (activeFilters.status === 'locked' && !level.unlocked);
      return difficultyMatch && statusMatch;
    }).length;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'from-green-400 to-green-600';
      case 'Medium': return 'from-yellow-400 to-yellow-600';
      case 'Hard': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toggle & Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EnhancedButton
            variant={showFilters ? "primary" : "ghost"}
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
          >
            Filters
          </EnhancedButton>
          
          <div className="text-sm text-gray-600">
            Showing {getFilteredCount()} of {levels.length} levels
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2">
          {statuses.slice(1).map((status) => {
            const count = levels.filter(level => {
              if (status.key === 'unlocked') return level.unlocked;
              if (status.key === 'completed') return level.completed;
              if (status.key === 'locked') return !level.unlocked;
              return true;
            }).length;

            return (
              <motion.button
                key={status.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFilterChange('status', status.key)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${activeFilters.status === status.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <span className="mr-1">{status.icon}</span>
                {count}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="game-card p-4 space-y-4"
          >
            {/* Difficulty Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <StarIcon className="w-4 h-4 text-yellow-500" />
                Difficulty Level
              </h4>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <motion.button
                    key={difficulty}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFilterChange('difficulty', difficulty)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${activeFilters.difficulty === difficulty
                        ? `bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white shadow-md`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {difficulty === 'all' ? 'All Difficulties' : difficulty}
                    {difficulty !== 'all' && (
                      <span className="ml-2">
                        {difficulty === 'Easy' && '⭐'}
                        {difficulty === 'Medium' && '⭐⭐'}
                        {difficulty === 'Hard' && '⭐⭐⭐'}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-green-500" />
                Completion Status
              </h4>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <motion.button
                    key={status.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFilterChange('status', status.key)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                      ${activeFilters.status === status.key
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <span>{status.icon}</span>
                    {status.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-purple-500" />
                Sort By
              </h4>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <motion.button
                    key={option.key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFilterChange('sort', option.key)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${activeFilters.sort === option.key
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <EnhancedButton
                variant="ghost"
                size="small"
                onClick={() => onFilterChange({ difficulty: 'all', status: 'all', sort: 'order' })}
              >
                Clear All Filters
              </EnhancedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}