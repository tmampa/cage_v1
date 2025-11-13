'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserIcon,
  HomeIcon,
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  StarIcon,
  FireIcon,
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useChatbot } from '../../context/ChatbotContext';
import { getFirebaseLeaderboardData } from '../../lib/firebase';
import FeedbackButton from '../../components/FeedbackButton';
import EnhancedButton from '../../components/EnhancedButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractLeaderboardContext } from '../../utils/chatbotContext';

export default function LeaderboardPage() {
  const { user, userProfile } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter, user?.id]);

  async function fetchLeaderboardData() {
    try {
      setLoading(true);
      const data = await getFirebaseLeaderboardData(timeFilter);
      setLeaderboardData(data);

      // Find user's rank if they're logged in
      if (user?.id) {
        const userIndex = data.findIndex((player) => player.userId === user.id);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Filter and sort leaderboard data
  const filteredData = leaderboardData
    .filter((item) =>
      item.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.score - a.score);

  // Get medal emoji and styling based on rank
  const getRankStyling = (index) => {
    switch (index) {
      case 0:
        return {
          medal: '🥇',
          bgColor: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        };
      case 1:
        return {
          medal: '🥈',
          bgColor: 'bg-gradient-to-r from-gray-100 to-gray-200',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        };
      case 2:
        return {
          medal: '🥉',
          bgColor: 'bg-gradient-to-r from-orange-100 to-orange-200',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300'
        };
      default:
        return {
          medal: '',
          bgColor: 'bg-white',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      {/* Header section */}
      <div className='container mx-auto p-4'>
        <div className='flex justify-between items-center mb-6'>
          <Link
            href='/'
            className='inline-flex items-center text-blue-700 hover:text-blue-900'
          >
            <ArrowLeftIcon className='w-5 h-5 mr-2' />
            <span>Back to Home</span>
          </Link>
          {user && userProfile && (
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
          )}
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-6'
        >
          <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2'>
            Leaderboard
          </h1>
          <p className='text-blue-700'>
            See how you rank against other cyber heroes!
          </p>
        </motion.div>

        {/* User's rank card - show only if user is logged in and ranked */}
        {user && userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='game-card p-4 mb-6'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl'>
                  {userProfile?.avatar_emoji || '👤'}
                </div>
                <div>
                  <p className='text-sm text-blue-600'>Your Rank</p>
                  <p className='text-xl font-bold text-purple-700'>
                    #{userRank}
                  </p>
                </div>
              </div>
              <div>
                <p className='text-sm text-blue-600'>Score</p>
                <p className='text-xl font-bold text-purple-700'>
                  {userProfile?.score || 0}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Filter controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='game-card p-4 mb-6'
        >
          <div className='flex flex-col gap-4'>
            {/* Search Bar */}
            <div className='relative'>
              <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
              <input
                type='text'
                placeholder='Search cyber heroes...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all'
              />
            </div>
            
            {/* Time Filter Buttons */}
            <div className='flex gap-2 overflow-x-auto'>
              {[
                { key: 'all', label: 'All Time', icon: <StarIcon className="w-4 h-4" /> },
                { key: 'week', label: 'This Week', icon: <FireIcon className="w-4 h-4" /> },
                { key: 'month', label: 'This Month', icon: <CalendarIcon className="w-4 h-4" /> }
              ].map((filter) => (
                <EnhancedButton
                  key={filter.key}
                  variant={timeFilter === filter.key ? 'primary' : 'ghost'}
                  size="small"
                  onClick={() => setTimeFilter(filter.key)}
                  icon={filter.icon}
                  className="whitespace-nowrap"
                >
                  {filter.label}
                </EnhancedButton>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard list */}
        <div className='game-card overflow-hidden'>
          {error && (
            <div className='text-center py-10'>
              <p className='text-red-500 mb-4'>{error}</p>
              <button onClick={fetchLeaderboardData} className='btn-primary'>
                Try Again
              </button>
            </div>
          )}

          {loading && !error && (
            <div className='py-10'>
              <LoadingSpinner 
                message="Loading Leaderboard..."
                submessage="Fetching the latest cyber hero rankings!"
              />
            </div>
          )}

          {!loading && !error && filteredData.length === 0 && (
            <div className='text-center py-10'>
              <TrophyIcon className='w-12 h-12 text-blue-300 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-blue-700 mb-2'>
                No Players Found
              </h3>
              <p className='text-blue-600'>
                {searchQuery
                  ? 'No players match your search. Try a different search term.'
                  : 'Be the first to play and score!'}
              </p>
            </div>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className='space-y-2 p-4'
            >
              {filteredData.map((player, index) => {
                const rankStyling = getRankStyling(index);
                const isCurrentUser = player.userId === user?.id;
                
                return (
                  <motion.div
                    key={player.userId}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`
                      relative overflow-hidden rounded-xl border-2 transition-all duration-200
                      ${rankStyling.bgColor} ${rankStyling.borderColor}
                      ${isCurrentUser ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}
                      ${index < 3 ? 'shadow-lg' : 'shadow-md'}
                    `}
                  >
                    {/* Rank Badge */}
                    <div className='absolute top-2 left-2'>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                        ${index < 3 ? 'bg-white shadow-md' : 'bg-gray-100'}
                        ${rankStyling.textColor}
                      `}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Medal for top 3 */}
                    {rankStyling.medal && (
                      <div className='absolute top-2 right-2 text-2xl'>
                        {rankStyling.medal}
                      </div>
                    )}

                    {/* Current user indicator */}
                    {isCurrentUser && (
                      <div className='absolute top-2 right-12 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
                        You
                      </div>
                    )}

                    <div className='flex items-center p-4 pt-12'>
                      {/* Avatar */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-2xl mr-4
                        ${index < 3 ? 'bg-white shadow-md' : 'bg-gray-100'}
                      `}>
                        {player.avatar_emoji || '👤'}
                      </div>

                      {/* Player Info */}
                      <div className='flex-grow'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className={`font-bold text-lg ${rankStyling.textColor}`}>
                            {player.username}
                          </h3>
                          {index < 3 && (
                            <StarIcon className='w-4 h-4 text-yellow-500' />
                          )}
                        </div>
                        
                        <div className='flex items-center gap-4 text-sm'>
                          <div className='flex items-center gap-1'>
                            <TrophyIcon className='w-4 h-4 text-yellow-600' />
                            <span className={`font-semibold ${rankStyling.textColor}`}>
                              {player.score.toLocaleString()} pts
                            </span>
                          </div>
                          
                          {player.updatedAt && (
                            <div className='text-gray-600 text-xs'>
                              Last active: {new Date(player.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className='text-right'>
                        <div className={`text-2xl font-bold ${rankStyling.textColor}`}>
                          #{index + 1}
                        </div>
                        {index < 3 && (
                          <div className='text-xs text-gray-600'>
                            Top Player
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Animated background for top 3 */}
                    {index < 3 && (
                      <div className='absolute inset-0 opacity-10 pointer-events-none'>
                        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse' />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
        <div className='flex justify-around items-center'>
          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <HomeIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Home</span>
            </div>
          </Link>

          <Link href='/game/levels' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-blue-600'>
              <PuzzlePieceIcon className='w-6 h-6' />
              <span className='text-xs mt-1'>Levels</span>
            </div>
          </Link>

          <Link href='/leaderboard' className='flex-1'>
            <div className='flex flex-col items-center py-3 text-purple-600 border-t-2 border-purple-600'>
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
