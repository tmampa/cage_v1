'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserIcon,
  HomeIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  MapIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useChatbot } from '../../../context/ChatbotContext';

import EnhancedLevelCard from '../../../components/EnhancedLevelCard';
import LevelMap from '../../../components/LevelMap';
import ProgressDashboard from '../../../components/ProgressDashboard';
import LevelFilters from '../../../components/LevelFilters';
import EnhancedButton from '../../../components/EnhancedButton';
import { getAchievementProgress } from '../../../utils/achievements';
import { extractLevelsContext, throttle } from '../../../utils/chatbotContext';
import BottomNav from '../../../components/BottomNav';
import { LEVEL_DEFINITIONS } from '../../../constants/levels';

// Map a canonical LevelDefinition into the UI shape the levels page renders.
// Only level 1 starts unlocked; the progress effect below recomputes this.
const initialLevels = () =>
  LEVEL_DEFINITIONS.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    difficulty: l.difficulty,
    unlocked: l.id === 1,
    completed: false,
    icon: l.icon,
    color: l.color,
    points: l.points,
    questions: l.questionsCount,
  }));

export default function LevelsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();

  const [levels, setLevels] = useState(initialLevels);

  // Track user progress stats
  const [progressStats, setProgressStats] = useState({
    unlockedCount: 1,
    completedCount: 0,
    progressPercentage: 0,
    completedLevels: [],
  });

  // Recent achievements state
  const [recentAchievements, setRecentAchievements] = useState([]);

  // Real user stats from Firestore
  const [userStats, setUserStats] = useState(null);

  // New state for enhanced UI
  const [viewMode, setViewMode] = useState('map'); // 'map', 'grid'
  const [filters, setFilters] = useState({
    difficulty: 'all',
    status: 'all',
    sort: 'order'
  });

  useEffect(() => {
    if (user?.isAdmin) {
      router.replace('/admin');
    }
  }, [user?.isAdmin, router]);

  // Load user progress from API
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user?.id || user.isAdmin) return;

      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        const userProgress = data.progress || [];

        const completedLevelIds = userProgress
          .filter(p => p.completed)
          .map(p => p.levelId);
        const highestCompletedLevel = completedLevelIds.length > 0
          ? Math.max(...completedLevelIds)
          : 0;

        const updatedLevels = levels.map((level) => {
          const progress = userProgress.find((p) => p.levelId === level.id);
          const isCompleted = progress?.completed || false;
          const levelScore = progress?.score || 0;
          const isUnlocked = level.id === 1 || level.id <= highestCompletedLevel + 1;

          return { ...level, unlocked: isUnlocked, completed: isCompleted, userScore: levelScore };
        });

        setLevels(updatedLevels);

        const completedCount = updatedLevels.filter(l => l.completed).length;
        setProgressStats({
          unlockedCount: updatedLevels.filter(l => l.unlocked).length,
          completedCount,
          progressPercentage: Math.round((completedCount / updatedLevels.length) * 100),
          completedLevels: updatedLevels.filter(l => l.completed).map(l => l.id),
        });

        // Load achievements from localStorage
        const storedAchievements = localStorage.getItem(`achievements_${user.id}`);
        if (storedAchievements) {
          const achievements = JSON.parse(storedAchievements);
          const recent = achievements
            .filter(a => a.earnedAt)
            .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
            .slice(0, 5);
          setRecentAchievements(recent);
        }
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    };

    loadUserProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isAdmin]);


  // Filter and sort levels based on current filters
  const getFilteredLevels = () => {
    let filtered = [...levels];

    // Apply difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(level => level.difficulty === filters.difficulty);
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(level => {
        switch (filters.status) {
          case 'unlocked': return level.unlocked;
          case 'completed': return level.completed;
          case 'locked': return !level.unlocked;
          default: return true;
        }
      });
    }

    // Apply sorting
    switch (filters.sort) {
      case 'difficulty':
        const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
      case 'points':
        filtered.sort((a, b) => b.points - a.points);
        break;
      default: // 'order'
        filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  };

  const filteredLevels = getFilteredLevels();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-900 relative pb-20'>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className='relative z-10'>
        <div className='flex items-center justify-between p-4'>
          <Link href='/' className='flex items-center text-gray-600 hover:text-gray-800 transition-colors'>
            <ArrowLeftIcon className='w-5 h-5 mr-2' />
            <span className="font-medium">Home</span>
          </Link>

          {/* View Mode Toggle */}
          <div className='flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm'>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'map' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <MapIcon className='w-4 h-4' />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <ViewColumnsIcon className='w-4 h-4' />
            </button>
          </div>

          {/* User Profile */}
          {user && userProfile && (
            <Link href='/profile'>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-all'
              >
                <div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center'>
                  <span className='text-lg'>{userProfile?.avatarEmoji || '👤'}</span>
                </div>
                <div className="hidden sm:block">
                  <div className='text-sm font-bold text-gray-800'>{userProfile?.username || 'User'}</div>
                  <div className='text-xs text-gray-500'>{userProfile?.score || 0} pts</div>
                </div>
              </motion.div>
            </Link>
          )}
        </div>

        {/* Page Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className='text-center px-4 mb-8'
        >
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2'>
            CAGE
          </h1>
          <p className='text-gray-600 text-lg'>Master the art of digital defense</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className='relative z-10 px-4 space-y-8'>
        {/* Progress Dashboard */}
        <ProgressDashboard 
          userProfile={userProfile}
          progressStats={progressStats}
          levels={levels}
          recentAchievements={recentAchievements}
          userStats={userStats}
        />

        {/* Level Filters (only show in grid mode) */}
        {viewMode === 'grid' && (
          <LevelFilters 
            levels={levels}
            onFilterChange={setFilters}
            activeFilters={filters}
          />
        )}

        {/* Level Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <MapIcon className="w-6 h-6 text-blue-500" />
                  Learning Path
                </h2>
                <p className="text-gray-600">Follow the path to become a cybersecurity expert</p>
              </div>
              <LevelMap levels={levels} userProgress={progressStats} />
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <ViewColumnsIcon className="w-6 h-6 text-purple-500" />
                  All Levels
                </h2>
                <p className="text-gray-600">Choose any unlocked level to practice</p>
              </div>
              
              <motion.div
                variants={containerVariants}
                initial='hidden'
                animate='visible'
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              >
                {filteredLevels.map((level) => (
                  <motion.div
                    key={level.id}
                    variants={itemVariants}
                    layout
                  >
                    <EnhancedLevelCard
                      level={level}
                      isUnlocked={level.unlocked}
                      isCompleted={level.completed}
                      userScore={level.userScore}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {filteredLevels.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No levels found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters to see more levels</p>
                  <EnhancedButton
                    variant="ghost"
                    onClick={() => setFilters({ difficulty: 'all', status: 'all', sort: 'order' })}
                  >
                    Clear Filters
                  </EnhancedButton>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="levels" />


    </div>
  );
}
