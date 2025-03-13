'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserIcon,
  HomeIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getFirebaseLeaderboardData } from '../../lib/firebase';

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

  // Get medal emoji based on rank
  const getMedalEmoji = (index) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '';
    }
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

        {/* Filter controls */}
        <div className='game-card p-4 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-grow'>
              <input
                type='text'
                placeholder='Search players...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 rounded-full border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400'
              />
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  timeFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  timeFilter === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  timeFilter === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-500 hover:bg-blue-200'
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>

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
            <div className='text-center py-10'>
              <div className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
              <p className='text-blue-700'>Loading leaderboard...</p>
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
            <div className='divide-y divide-blue-100'>
              {filteredData.map((player, index) => (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center p-4 ${
                    player.userId === user?.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className='w-8 text-center font-bold text-purple-700'>
                    {index + 1}
                  </div>
                  <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl mx-4'>
                    {player.avatar_emoji || '👤'}
                  </div>
                  <div className='flex-grow'>
                    <p className='font-bold text-blue-900'>
                      {player.username}
                      {getMedalEmoji(index)}
                    </p>
                    <p className='text-sm text-blue-600'>
                      Score: {player.score}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className='fixed bottom-0 left-0 right-0 bg-white shadow-lg z-30'>
        <div className='flex justify-around items-center'>
          <Link href='/' className='flex-1'>
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
    </div>
  );
}
