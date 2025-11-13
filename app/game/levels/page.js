'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getAchievementProgress } from '../../../utils/achievements';
import { extractLevelsContext, throttle } from '../../../utils/chatbotContext';

export default function LevelsPage() {
  const { user, userProfile } = useAuth();

  // State for levels and user progress
  const [levels, setLevels] = useState([
    {
      id: 1,
      title: 'Cyber Security Basics',
      description: 'Learn the fundamentals of staying safe online',
      difficulty: 'Easy',
      unlocked: true,
      completed: false,
      icon: '🛡️',
      color: 'from-blue-400 to-blue-600',
      points: 100,
      questions: 5,
    },
    {
      id: 2,
      title: 'Password Protection',
      description: 'Create strong passwords and keep them safe',
      difficulty: 'Easy',
      unlocked: false,
      completed: false,
      icon: '🔑',
      color: 'from-green-400 to-green-600',
      points: 150,
      questions: 6,
    },
    {
      id: 3,
      title: 'Phishing Attacks',
      description: 'Identify and avoid dangerous emails and messages',
      difficulty: 'Medium',
      unlocked: false,
      completed: false,
      icon: '🎣',
      color: 'from-yellow-400 to-yellow-600',
      points: 200,
      questions: 7,
    },
    {
      id: 4,
      title: 'Safe Web Browsing',
      description: 'Navigate the internet safely and avoid threats',
      difficulty: 'Medium',
      unlocked: false,
      completed: false,
      icon: '🌐',
      color: 'from-purple-400 to-purple-600',
      points: 250,
      questions: 8,
    },
    {
      id: 5,
      title: 'Social Media Safety',
      description: 'Protect your personal information on social platforms',
      difficulty: 'Hard',
      unlocked: false,
      completed: false,
      icon: '📱',
      color: 'from-pink-400 to-pink-600',
      points: 300,
      questions: 9,
    },
    {
      id: 6,
      title: 'Malware Defense',
      description: 'Understand and protect against computer viruses',
      difficulty: 'Hard',
      unlocked: false,
      completed: false,
      icon: '🦠',
      color: 'from-red-400 to-red-600',
      points: 350,
      questions: 10,
    },
  ]);

  // Track user progress stats
  const [progressStats, setProgressStats] = useState({
    unlockedCount: 1,
    completedCount: 0,
    progressPercentage: 0,
    completedLevels: [],
  });

  // Recent achievements state
  const [recentAchievements, setRecentAchievements] = useState([]);

  // New state for enhanced UI
  const [viewMode, setViewMode] = useState('map'); // 'map', 'grid'
  const [filters, setFilters] = useState({
    difficulty: 'all',
    status: 'all',
    sort: 'order'
  });

  // Load user progress from Firebase
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!user?.id) return;

      try {
        // Get user's profile for highest level
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        const highestLevel = userDoc.exists()
          ? userDoc.data().highestLevel || 1
          : 1;

        // Get all progress documents for this user
        const progressRef = collection(db, 'progress');
        const q = query(progressRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);

        const userProgress = [];
        querySnapshot.forEach((doc) => {
          userProgress.push(doc.data());
        });

        // Update levels with unlocked and completed status
        const updatedLevels = levels.map((level) => {
          const isUnlocked = level.id <= highestLevel + 1; // Next level is always unlocked
          const progress = userProgress.find((p) => p.levelId === level.id);
          const isCompleted = progress?.passed || false;
          const levelScore = progress?.score || 0;

          return {
            ...level,
            unlocked: isUnlocked,
            completed: isCompleted,
            userScore: levelScore,
          };
        });

        setLevels(updatedLevels);

        // Calculate progress stats
        const unlockedCount = updatedLevels.filter((l) => l.unlocked).length;
        const completedCount = updatedLevels.filter((l) => l.completed).length;
        const progressPercentage = Math.round(
          (completedCount / levels.length) * 100
        );

        setProgressStats({
          unlockedCount,
          completedCount,
          progressPercentage,
          completedLevels: updatedLevels.filter(l => l.completed).map(l => l.id),
        });

        // Load recent achievements from localStorage
        const storedAchievements = localStorage.getItem(`achievements_${user.id}`);
        if (storedAchievements) {
          const achievements = JSON.parse(storedAchievements);
          // Sort by earnedAt date and take the 5 most recent
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
  }, [user?.id]);

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
                  <span className='text-lg'>{userProfile?.avatar_emoji || '👤'}</span>
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
      <div className='fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg z-30 border-t border-gray-200'>
        <div className='flex justify-around items-center py-2'>
          <Link href='/' className='flex-1'>
            <div className='flex flex-col items-center py-2 text-gray-600 hover:text-blue-500 transition-colors'>
              <HomeIcon className='w-5 h-5' />
              <span className='text-xs mt-1'>Home</span>
            </div>
          </Link>

          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-2 text-blue-500 relative'>
              <PuzzlePieceIcon className='w-5 h-5' />
              <span className='text-xs mt-1 font-medium'>Levels</span>
              <div className='absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full'></div>
            </div>
          </Link>

          <Link href='/leaderboard' className='flex-1'>
            <div className='flex flex-col items-center py-2 text-gray-600 hover:text-blue-500 transition-colors'>
              <TrophyIcon className='w-5 h-5' />
              <span className='text-xs mt-1'>Leaderboard</span>
            </div>
          </Link>

          <Link href='/profile' className='flex-1'>
            <div className='flex flex-col items-center py-2 text-gray-600 hover:text-blue-500 transition-colors'>
              <UserIcon className='w-5 h-5' />
              <span className='text-xs mt-1'>Profile</span>
            </div>
          </Link>
        </div>
      </div>


    </div>
  );
}
