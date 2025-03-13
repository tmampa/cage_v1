'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  TrophyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { getFirebaseLeaderboardData } from '../../lib/firebase';

export default function LeaderboardPage() {
  // State for leaderboard data
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filter options
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch leaderboard data
  useEffect(() => {
    fetchLeaderboardData();
  }, [timeFilter]); // Re-fetch when timeFilter changes

  // Function to fetch leaderboard data
  async function fetchLeaderboardData() {
    try {
      setLoading(true);
      const data = await getFirebaseLeaderboardData(timeFilter);
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      setError('Failed to load leaderboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  // Animation variants
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

  // Filter leaderboard data
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
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 p-4 overflow-hidden'>
      {/* Decorative bubbles */}
      <div className='bubble w-20 h-20 top-20 left-10'></div>
      <div className='bubble w-16 h-16 top-40 right-10'></div>
      <div className='bubble w-24 h-24 bottom-20 left-1/3'></div>
      <div className='bubble w-12 h-12 top-1/3 right-20'></div>

      {/* Header with back button */}
      <div className='container mx-auto mb-6'>
        <Link
          href='/'
          className='inline-flex items-center text-blue-700 hover:text-blue-900'
        >
          <ArrowLeftIcon className='w-5 h-5 mr-2' />
          <span>Back to Home</span>
        </Link>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center mt-4'
        >
          <h1 className='text-4xl font-bold gradient-text mb-2'>Leaderboard</h1>
          <p className='text-center text-blue-700 mb-4'>
            See how you rank against other cyber heroes!
          </p>
        </motion.div>
      </div>

      {/* Search and filter options */}
      <div className='container mx-auto mb-6'>
        <div className='bg-white rounded-xl p-4 shadow-md'>
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
      </div>

      {/* Top 3 players - featured section */}
      {filteredData.length > 0 && (
        <div className='container mx-auto mb-8'>
          <h2 className='text-xl font-bold text-center mb-4'>
            Top Cyber Heroes
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {filteredData.slice(0, 3).map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`game-card p-4 text-center ${
                  index === 0
                    ? 'border-4 border-yellow-400'
                    : index === 1
                    ? 'border-4 border-gray-300'
                    : 'border-4 border-amber-600'
                }`}
              >
                <div className='flex justify-center mb-2'>
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                      index === 0
                        ? 'bg-yellow-100'
                        : index === 1
                        ? 'bg-gray-100'
                        : 'bg-amber-100'
                    }`}
                  >
                    {player.avatar}
                  </div>
                </div>
                <div className='text-2xl font-bold mb-1'>
                  {getMedalEmoji(index)}
                </div>
                <h3 className='text-lg font-bold text-purple-600 mb-1'>
                  {player.username}
                </h3>
                <p className='text-blue-700'>Score: {player.score}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      <div className='container mx-auto'>
        <div className='bg-white rounded-xl p-6 shadow-lg'>
          {/* Display error message if there's an error */}
          {error && (
            <div className='text-center py-10'>
              <p className='text-red-500 mb-4'>{error}</p>
              <button
                onClick={() => fetchLeaderboardData()}
                className='px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600'
              >
                Try Again
              </button>
            </div>
          )}

          {/* Display loading state */}
          {loading && !error && (
            <div className='text-center py-10'>
              <div className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
              <p className='text-blue-700'>Loading leaderboard data...</p>
            </div>
          )}

          {/* Display empty state */}
          {!loading && !error && filteredData.length === 0 && (
            <div className='text-center py-10'>
              <TrophyIcon className='w-12 h-12 text-blue-300 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-blue-700 mb-2'>
                No Players Found
              </h3>
              <p className='text-blue-600'>
                {searchQuery
                  ? 'No players match your search. Try a different search term.'
                  : 'The leaderboard is empty. Be the first to play and score!'}
              </p>
            </div>
          )}

          {/* Display leaderboard data */}
          {!loading && !error && filteredData.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              className='overflow-x-auto'
            >
              <table className='min-w-full'>
                <thead>
                  <tr className='border-b border-blue-100'>
                    <th className='py-3 px-4 text-left text-blue-800 font-bold'>
                      Rank
                    </th>
                    <th className='py-3 px-4 text-left text-blue-800 font-bold'>
                      Player
                    </th>
                    <th className='py-3 px-4 text-right text-blue-800 font-bold'>
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((player, index) => (
                    <motion.tr
                      key={player.userId || player.id}
                      variants={itemVariants}
                      className='border-b border-blue-50 hover:bg-blue-50'
                    >
                      <td className='py-3 px-4 text-center font-bold'>
                        {index + 1}
                      </td>
                      <td className='py-3 px-4 text-left'>
                        <div className='flex items-center'>
                          <div className='w-8 h-8 rounded-full flex items-center justify-center text-lg bg-blue-100 mr-2'>
                            {player.avatar}
                          </div>
                          <span className='font-bold truncate'>
                            {player.username}
                          </span>
                          {index < 3 && (
                            <span className='ml-2'>{getMedalEmoji(index)}</span>
                          )}
                        </div>
                      </td>
                      <td className='py-3 px-4 text-right font-bold text-purple-600'>
                        {player.score}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </div>

      {/* Your rank section */}
      <div className='container mx-auto mt-8'>
        <div className='game-card p-4'>
          <h3 className='text-lg font-bold text-center mb-4'>Your Rank</h3>
          <div className='bg-blue-50 p-3 rounded-lg'>
            <div className='grid grid-cols-12 gap-2 items-center'>
              <div className='col-span-1 text-center font-bold'>4</div>
              <div className='col-span-7 sm:col-span-8'>
                <div className='flex items-center'>
                  <div className='w-8 h-8 rounded-full flex items-center justify-center text-lg bg-green-100 mr-2'>
                    😎
                  </div>
                  <span className='font-bold'>You</span>
                </div>
              </div>
              <div className='col-span-4 sm:col-span-3 text-right font-bold text-purple-600'>
                900
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className='container mx-auto mt-8 flex justify-center space-x-4'>
        <Link href='/game/levels'>
          <button className='btn-primary'>Play More Levels</button>
        </Link>
        <Link href='/'>
          <button className='btn-secondary'>Home</button>
        </Link>
      </div>
    </div>
  );
}
