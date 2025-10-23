'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon, 
  LightBulbIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  PlayIcon
} from '@heroicons/react/24/solid';
import { AnimatedProgressBar } from './ProgressIndicators';
import EnhancedButton from './EnhancedButton';

export default function ProgressDashboard({ 
  userProfile, 
  progressStats, 
  levels,
  recentAchievements = []
}) {
  // Get the last played level from localStorage
  const getLastPlayedLevel = () => {
    if (typeof window !== 'undefined' && userProfile?.id) {
      const lastPlayed = localStorage.getItem(`lastPlayedLevel_${userProfile.id}`);
      return lastPlayed ? parseInt(lastPlayed) : null;
    }
    return null;
  };
  // Sample achievements for demo purposes when no real achievements are loaded
  const sampleAchievements = [
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first level',
      icon: '👶',
      points: 50,
      earnedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 'brave_beginner',
      title: 'Brave Beginner',
      description: 'Start your cybersecurity journey',
      icon: '🚀',
      points: 10,
      earnedAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
  ];

  // Use real achievements if available, otherwise show samples for completed users
  const displayAchievements = recentAchievements.length > 0 
    ? recentAchievements 
    : (progressStats.completedCount > 0 ? sampleAchievements : []);
  const totalPossiblePoints = levels.reduce((sum, level) => sum + level.points, 0);
  const currentScore = userProfile?.score || 0;
  const overallProgress = Math.round((currentScore / totalPossiblePoints) * 100);

  const stats = [
    {
      icon: <TrophyIcon className="w-6 h-6 text-yellow-500" />,
      label: "Total Score",
      value: currentScore.toLocaleString(),
      subtext: `${overallProgress}% complete`,
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-green-500" />,
      label: "Levels Completed",
      value: `${progressStats.completedCount}/${levels.length}`,
      subtext: `${progressStats.unlockedCount} unlocked`,
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <StarIcon className="w-6 h-6 text-purple-500" />,
      label: "Accuracy Rate",
      value: "85%", // This would be calculated from actual game data
      subtext: "Keep it up!",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <FireIcon className="w-6 h-6 text-red-500" />,
      label: "Current Streak",
      value: "3", // This would come from game stats
      subtext: "questions in a row",
      color: "from-red-400 to-orange-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-6 bg-gradient-to-br from-blue-50 to-purple-50"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Welcome back, {userProfile?.username || 'Cyber Hero'}! 👋
            </h2>
            <p className="text-gray-600">Ready to continue your cybersecurity journey?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-1">{userProfile?.avatar_emoji || '🛡️'}</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-purple-600">{overallProgress}%</span>
          </div>
          <AnimatedProgressBar
            progress={currentScore}
            total={totalPossiblePoints}
            color="purple"
            size="large"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  {React.cloneElement(stat.icon, { className: "w-4 h-4 text-white" })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-500 truncate">{stat.label}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">{stat.subtext}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="game-card p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            {(() => {
              // Ensure we have levels data
              if (!levels || levels.length === 0) {
                return (
                  <Link 
                    href="/game/levels" 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    Start Learning
                  </Link>
                );
              }
              
              // Find where the player left off
              let targetLevel = null;
              let buttonText = 'Continue Learning';
              let targetUrl = '/game/levels';
              
              const lastPlayedLevelId = getLastPlayedLevel();
              
              // Strategy 1: If we have a last played level and it's not completed, continue there
              if (lastPlayedLevelId) {
                const lastPlayedLevel = levels.find(level => level.id === lastPlayedLevelId);
                if (lastPlayedLevel && lastPlayedLevel.unlocked && !lastPlayedLevel.completed) {
                  targetLevel = lastPlayedLevel;
                  buttonText = `Continue Level ${targetLevel.id}`;
                }
              }
              
              // Strategy 2: If no valid last played level, find the first unlocked incomplete level
              if (!targetLevel) {
                targetLevel = levels.find(level => level.unlocked === true && level.completed === false);
                if (targetLevel) {
                  buttonText = `Continue Level ${targetLevel.id}`;
                }
              }
              
              // Strategy 3: If all unlocked levels are completed, find the next level to unlock
              if (!targetLevel) {
                const highestCompletedId = Math.max(...levels.filter(l => l.completed).map(l => l.id), 0);
                targetLevel = levels.find(level => level.id === highestCompletedId + 1);
                if (targetLevel) {
                  buttonText = `Start Level ${targetLevel.id}`;
                }
              }
              
              // Strategy 4: Handle completion or fallback
              if (!targetLevel) {
                if (progressStats.completedCount === levels.length) {
                  buttonText = 'All Levels Complete!';
                  targetUrl = '/game/levels';
                } else {
                  // Fallback: go to level 1
                  buttonText = 'Start Level 1';
                  targetUrl = '/game/play/1';
                }
              } else {
                targetUrl = `/game/play/${targetLevel.id}`;
              }
              
              return (
                <Link 
                  href={targetUrl} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  {buttonText}
                </Link>
              );
            })()}
            
            <div className="grid grid-cols-3 gap-2">
              <Link 
                href="/profile" 
                className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 hover:text-blue-700 transition-all flex items-center justify-center gap-1 border border-gray-200 hover:border-blue-300"
              >
                <ChartBarIcon className="w-4 h-4" />
                Stats
              </Link>
              <Link 
                href="/leaderboard" 
                className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-yellow-100 hover:text-yellow-700 transition-all flex items-center justify-center gap-1 border border-gray-200 hover:border-yellow-300"
              >
                <TrophyIcon className="w-4 h-4" />
                Ranks
              </Link>
              <button 
                onClick={() => {
                  // Find a random completed level for practice
                  const completedLevels = levels.filter(level => 
                    progressStats.completedLevels?.includes(level.id)
                  );
                  if (completedLevels.length > 0) {
                    const randomLevel = completedLevels[Math.floor(Math.random() * completedLevels.length)];
                    window.location.href = `/game/play/${randomLevel.id}?practice=true`;
                  } else {
                    // If no completed levels, go to the first unlocked level
                    const firstUnlocked = levels.find(level => level.unlocked && !level.completed);
                    if (firstUnlocked) {
                      window.location.href = `/game/play/${firstUnlocked.id}`;
                    } else {
                      window.location.href = '/game/levels';
                    }
                  }
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-100 hover:text-green-700 transition-all flex items-center justify-center gap-1 border border-gray-200 hover:border-green-300"
                title={progressStats.completedCount > 0 ? "Practice a completed level" : "Start next level"}
              >
                <PlayIcon className="w-4 h-4" />
                {progressStats.completedCount > 0 ? "Practice" : "Play"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="game-card p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-yellow-500" />
            Recent Achievements
          </h3>
          
          {displayAchievements.length > 0 ? (
            <div className="space-y-3">
              {displayAchievements.slice(0, 3).map((achievement, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 hover:shadow-sm transition-shadow"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{achievement.title}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                    {achievement.earnedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-yellow-600 font-medium">+{achievement.points}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </motion.div>
              ))}
              
              {displayAchievements.length > 3 && (
                <Link 
                  href="/profile#achievements" 
                  className="w-full text-center py-2 text-sm text-purple-600 hover:text-purple-700 font-medium block"
                >
                  View all achievements ({displayAchievements.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-gray-600 text-sm mb-3">Complete levels to earn achievements!</p>
              <Link 
                href="/game/levels"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Start your first level →
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}