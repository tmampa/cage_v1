'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon, 
  LightBulbIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import { CircularProgress, AnimatedProgressBar } from './ProgressIndicators';

export default function ProgressDashboard({ 
  userProfile, 
  progressStats, 
  levels,
  recentAchievements = []
}) {
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
            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Continue Learning
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                <ChartBarIcon className="w-4 h-4" />
                Stats
              </button>
              <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                <TrophyIcon className="w-4 h-4" />
                Ranks
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
          
          {recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.slice(0, 3).map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{achievement.title}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                  </div>
                  <div className="text-xs text-yellow-600 font-medium">+{achievement.points}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-gray-600 text-sm">Complete levels to earn achievements!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}