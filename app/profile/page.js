'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useChatbot } from '../../context/ChatbotContext';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  UserIcon,
  TrophyIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  HomeIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  CalendarIcon,
  FireIcon,
  LightBulbIcon,
  StarIcon,
} from '@heroicons/react/24/solid';
import AuthWrapper from '../../components/AuthWrapper';
import FeedbackButton from '../../components/FeedbackButton';
import EnhancedButton from '../../components/EnhancedButton';
import { CircularProgress, AnimatedProgressBar } from '../../components/ProgressIndicators';
import { AchievementsList } from '../../components/AchievementNotification';
import { getAchievementProgress, DEFAULT_USER_STATS } from '../../utils/achievements';
import { extractProfileContext } from '../../utils/chatbotContext';
import BottomNav from '../../components/BottomNav';

const avatarEmojis = [
  '👧',
  '👦',
  '👩',
  '🧑',
  '👨',
  '👱‍♀️',
  '👱',
  '👴',
  '👵',
  '🧔',
  '🦸‍♀️',
  '🦸‍♂️',
  '🦹‍♀️',
  '🦹‍♂️',
  '🧙‍♀️',
  '🧙‍♂️',
  '🦊',
  '🐱',
  '🐶',
  '🐼',
];

function ProfilePage() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'achievements'
  const [userStats, setUserStats] = useState(DEFAULT_USER_STATS);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setSelectedAvatar(userProfile.avatar_emoji || '👤');
      
      // Load actual user stats from Postgres API instead of estimating
      loadActualUserStats();
    }
  }, [userProfile]);

  const loadActualUserStats = async () => {
    if (!user?.id) return;

    try {
      // Load progress from API
      const res = await fetch('/api/progress');
      const data = await res.json();
      const progress = data.progress || [];
      const completedLevels = progress.filter(p => p.completed).length;

      const calculatedStats = {
        ...DEFAULT_USER_STATS,
        levelsCompleted: completedLevels,
      };

      setUserStats(calculatedStats);

      // Load achievements from localStorage
      const storedAchievements = localStorage.getItem(`achievements_${user.id}`);
      const earnedAchievements = storedAchievements ? JSON.parse(storedAchievements) : [];
      const achievementProgress = getAchievementProgress(calculatedStats, earnedAchievements);
      setAchievements(achievementProgress);
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({ ...DEFAULT_USER_STATS });
    }
  };

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setSelectedAvatar(userProfile.avatar_emoji || '👤');
      loadActualUserStats();
    }
  }, [userProfile]);

  // Update chatbot context when profile data changes
  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      setError('Failed to sign out');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setUsername(userProfile.username || '');
      setSelectedAvatar(userProfile.avatar_emoji || '👤');
      setError('');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        username: username.trim(),
        avatar_emoji: selectedAvatar,
      });

      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinedDate = (dateValue) => {
    try {
      // Handle ISO strings or other date formats
      if (dateValue) {
        return new Date(dateValue).toLocaleDateString();
      }
      return 'Recently joined';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently joined';
    }
  };

  // Get the join date from userProfile - check both camelCase and snake_case
  const getJoinDate = () => {
    return userProfile?.created_at || userProfile?.createdAt;
  };

  if (!user || !userProfile) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 flex items-center justify-center'>
        <div className='game-card p-8 text-center'>
          <p className='text-blue-700 mb-4'>
            Please sign in to view your profile
          </p>
          <Link href='/auth/login'>
            <button className='btn-primary'>Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 text-blue-900 pb-20 relative'>
      {/* Header section */}
      <div className='container mx-auto p-4'>
        <div className='flex justify-between items-center mb-6'>
          <Link
            href='/game/levels'
            className='inline-flex items-center text-blue-700 hover:text-blue-900'
          >
            <ArrowLeftIcon className='w-5 h-5 mr-2' />
            <span>Back to Home</span>
          </Link>
          <div className='flex items-center gap-2 bg-white rounded-lg px-3 py-1 shadow-md'>
            <div className='bg-blue-100 rounded-full p-1'>
              <span className='text-xl'>
                {userProfile?.avatar_emoji || '👤'}
              </span>
            </div>
            <span className='font-bold text-purple-700'>
              {userProfile?.username || 'User'}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-6'
        >
          <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-2'>
            Your Profile
          </h1>
          <p className='text-blue-700'>Manage your cyber hero identity</p>
        </motion.div>

        {/* Profile Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='game-card p-4 mb-6'
        >
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl'>
                {selectedAvatar}
              </div>
              <div>
                <h2 className='text-xl font-bold text-purple-700'>
                  {username}
                </h2>
                <p className='text-sm text-blue-600'>Joined CagE</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEditToggle}
                className='bg-blue-100 text-blue-600 rounded-full p-2 hover:bg-blue-200 transition-colors'
              >
                <PencilIcon className='w-5 h-5' />
              </button>
            ) : (
              <div className='flex gap-2'>
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className='bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors disabled:opacity-50'
                >
                  <CheckIcon className='w-5 h-5' />
                </button>
                <button
                  onClick={handleEditToggle}
                  className='bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors'
                >
                  <XMarkIcon className='w-5 h-5' />
                </button>
              </div>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4 mb-4'>
            <div className='bg-blue-50 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-blue-700 mb-1'>
                <TrophyIcon className='w-4 h-4' />
                <span className='text-sm'>Total Score</span>
              </div>
              <p className='text-xl font-bold text-purple-700'>
                {userProfile.score || 0}
              </p>
            </div>
            <div className='bg-blue-50 rounded-lg p-3'>
              <div className='flex items-center gap-2 text-blue-700 mb-1'>
                <CalendarIcon className='w-4 h-4' />
                <span className='text-sm'>Joined</span>
              </div>
              <p className='text-sm text-purple-700'>
                {getJoinDate()
                  ? formatJoinedDate(getJoinDate())
                  : 'Recently joined'}
              </p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4'
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4'
            >
              {success}
            </motion.div>
          )}

          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-4'
            >
              <div>
                <label className='block text-sm font-medium text-blue-700 mb-1'>
                  Username
                </label>
                <input
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className='w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Your username'
                  minLength={3}
                  maxLength={20}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-blue-700 mb-2'>
                  Select Avatar
                </label>
                <div className='grid grid-cols-5 gap-2'>
                  {avatarEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        selectedAvatar === emoji
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <div className='flex bg-white rounded-lg p-1 mb-6 shadow-sm'>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'achievements'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-purple-600'
            }`}
          >
            🏆 Achievements
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-6 mb-6'
          >
            {/* Detailed Stats */}
            <div className='game-card p-6'>
              <h3 className='text-lg font-bold text-purple-700 mb-4'>Your Progress</h3>
              
              <div className='grid grid-cols-2 gap-6 mb-6'>
                <div className='text-center'>
                  <CircularProgress
                    progress={userStats.levelsCompleted}
                    total={6}
                    size={100}
                    color="purple"
                    label="Levels"
                  />
                </div>
                <div className='text-center'>
                  <CircularProgress
                    progress={userStats.correctAnswers}
                    total={Math.max(userStats.totalAnswers, 1)}
                    size={100}
                    color="green"
                    label="Accuracy"
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <AnimatedProgressBar
                    progress={userStats.levelsCompleted}
                    total={6}
                    label="Levels Completed"
                    color="blue"
                  />
                </div>
                
                <div className='grid grid-cols-2 gap-4'>
                  <div className='bg-blue-50 rounded-lg p-3 text-center'>
                    <div className='flex items-center justify-center gap-2 mb-1'>
                      <StarIcon className='w-4 h-4 text-yellow-500' />
                      <span className='text-sm text-gray-600'>Total Score</span>
                    </div>
                    <div className='text-xl font-bold text-purple-700'>
                      {userProfile.score || 0}
                    </div>
                  </div>
                  
                  <div className='bg-green-50 rounded-lg p-3 text-center'>
                    <div className='flex items-center justify-center gap-2 mb-1'>
                      <CheckIcon className='w-4 h-4 text-green-500' />
                      <span className='text-sm text-gray-600'>Correct</span>
                    </div>
                    <div className='text-xl font-bold text-green-700'>
                      {userStats.correctAnswers}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-2 gap-4'>
              <Link href='/game/levels'>
                <EnhancedButton 
                  variant="primary" 
                  className="w-full"
                  icon={<PuzzlePieceIcon className="w-5 h-5" />}
                >
                  Continue Learning
                </EnhancedButton>
              </Link>
              <Link href='/leaderboard'>
                <EnhancedButton 
                  variant="secondary" 
                  className="w-full"
                  icon={<ChartBarIcon className="w-5 h-5" />}
                >
                  View Rankings
                </EnhancedButton>
              </Link>
            </div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6'
          >
            <div className='game-card p-6'>
              <AchievementsList 
                achievements={achievements}
                userStats={userStats}
              />
            </div>
          </motion.div>
        )}

        {/* Sign Out Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleSignOut}
          className='w-full bg-red-100 text-red-600 py-3 px-4 rounded-lg hover:bg-red-200 transition-colors font-medium'
        >
          Sign Out
        </motion.button>
      </div>

      {/* Bottom navigation */}
      <BottomNav activeTab="profile" />

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
}

// Export the wrapped component
export default function ProtectedProfilePage() {
  return (
    <AuthWrapper>
      <ProfilePage />
    </AuthWrapper>
  );
}
