'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LockClosedIcon,
  LockOpenIcon,
  ArrowLeftIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
  HomeIcon,
  PuzzlePieceIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import FeedbackButton from '../../../components/FeedbackButton';
import { db } from '../../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

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
        });
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    };

    loadUserProgress();
  }, [user?.id]);

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
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 relative overflow-hidden pb-20'>
      {/* Decorative bubbles */}
      <div className='bubble w-20 h-20 top-20 left-10 opacity-60'></div>
      <div className='bubble w-16 h-16 top-40 right-10 opacity-60'></div>
      <div className='bubble w-24 h-24 bottom-20 left-1/3 opacity-60'></div>
      <div className='bubble w-12 h-12 top-1/3 right-20 opacity-60'></div>

      {/* User profile in top right */}
      {user && userProfile && (
        <div className='absolute top-4 right-4 z-20'>
          <Link href='/profile'>
            <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-md hover:bg-blue-50 transition-colors'>
              <div className='bg-blue-100 rounded-full p-1'>
                <span className='text-xl'>
                  {userProfile?.avatar_emoji || '👤'}
                </span>
              </div>
              <span className='font-bold text-purple-700'>
                {userProfile?.username || 'User'}
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* Header section */}
      <div className='pt-4 px-4'>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center mt-4 mb-6'
        >
          <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2'>
            Choose Your Level
          </h1>
          <p className='text-center text-blue-700 text-sm'>
            Complete levels to unlock new challenges!
          </p>
        </motion.div>
      </div>

      {/* Progress overview - more compact for mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='px-4 mb-6'
      >
        <div className='game-card p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
                <TrophyIcon className='w-5 h-5 text-yellow-500' />
              </div>
              <div>
                <h3 className='text-base font-bold text-purple-700'>
                  Your Progress
                </h3>
                <p className='text-blue-700 text-xs'>
                  Keep playing to unlock more!
                </p>
              </div>
            </div>
            <div>
              <p className='text-xs text-blue-600'>Points</p>
              <p className='text-xl font-bold text-purple-700'>
                {userProfile?.score || 0}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className='mt-3'>
            <div className='flex justify-between text-xs text-blue-700 mb-1'>
              <span>
                Levels Unlocked: {progressStats.unlockedCount}/{levels.length}
              </span>
              <span>
                Completed: {progressStats.completedCount}/{levels.length}
              </span>
            </div>
            <div className='h-3 bg-blue-100 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full'
                style={{ width: `${progressStats.progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Levels grid - 2x2 layout */}
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='px-4'
      >
        <div className='grid grid-cols-2 gap-3'>
          {levels.map((level) => (
            <motion.div
              key={level.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className='game-card overflow-hidden shadow-md'
            >
              <div
                className={`bg-gradient-to-r ${level.color} p-3 text-white relative`}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-3xl drop-shadow-md'>{level.icon}</span>
                  <div className='bg-white bg-opacity-20 rounded-full p-1.5'>
                    {level.unlocked ? (
                      <LockOpenIcon className='w-4 h-4 text-white' />
                    ) : (
                      <LockClosedIcon className='w-4 h-4 text-white' />
                    )}
                  </div>
                </div>
                <h2 className='text-sm font-bold mt-2 line-clamp-1'>
                  {level.title}
                </h2>
              </div>

              <div className='p-3 flex flex-col'>
                <p className='text-blue-700 mb-2 flex-grow text-xs line-clamp-2'>
                  {level.description}
                </p>

                <div className='flex justify-between items-center text-xs mb-2'>
                  <div className='flex'>
                    <StarIcon
                      className={`w-3 h-3 ${
                        level.difficulty === 'Easy' ||
                        level.difficulty === 'Medium' ||
                        level.difficulty === 'Hard'
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                    <StarIcon
                      className={`w-3 h-3 ${
                        level.difficulty === 'Medium' ||
                        level.difficulty === 'Hard'
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                    <StarIcon
                      className={`w-3 h-3 ${
                        level.difficulty === 'Hard'
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </div>
                  <div className='text-purple-700 font-semibold'>
                    {level.points} pts
                  </div>
                </div>

                {level.unlocked ? (
                  <>
                    {level.completed && (
                      <div className='flex justify-between text-xs mb-2'>
                        <span className='text-green-600 font-semibold flex items-center'>
                          <CheckIcon className='w-3 h-3 mr-1' />
                          Completed
                        </span>
                        <span className='text-blue-600 font-semibold'>
                          {level.userScore || 0} pts
                        </span>
                      </div>
                    )}
                    <Link href={`/game/play/${level.id}`}>
                      <button className='btn-primary w-full py-1.5 text-xs'>
                        {level.completed ? 'Play Again' : 'Play Now'}
                      </button>
                    </Link>
                  </>
                ) : (
                  <button className='bg-gray-200 text-gray-500 py-1.5 px-3 rounded-full w-full cursor-not-allowed font-bold text-xs'>
                    Locked
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom Tabs Navigation Bar */}
      <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
        <div className='flex justify-around items-center'>
          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <HomeIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Home</span>
            </div>
          </Link>

          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600'>
              <PuzzlePieceIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Levels</span>
            </div>
          </Link>

          <Link href='/leaderboard' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <TrophyIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Leaderboard</span>
            </div>
          </Link>

          <Link href='/profile' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <UserIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Profile</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
}
