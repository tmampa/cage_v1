'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      router.push('/game/levels');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push('/game/levels');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 flex flex-col items-center justify-center p-4 relative overflow-hidden'>
      {/* Decorative bubbles */}
      <div className='bubble w-20 h-20 top-20 left-10'></div>
      <div className='bubble w-16 h-16 top-40 right-10'></div>
      <div className='bubble w-24 h-24 bottom-20 left-1/3'></div>
      <div className='bubble w-12 h-12 top-1/3 right-20'></div>

      {/* Back button */}
      <div className='absolute top-4 left-4'>
        <Link
          href='/'
          className='text-blue-700 hover:text-blue-900 flex items-center'
        >
          <ArrowLeftIcon className='h-5 w-5 mr-1' />
          <span>Back</span>
        </Link>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='w-full max-w-md'
      >
        <div className='game-card p-8'>
          <div className='text-center mb-6'>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className='inline-block'
            >
              <ShieldCheckIcon className='h-16 w-16 text-blue-500 mx-auto mb-4' />
            </motion.div>
            <h1 className='text-3xl font-bold text-purple-700 mb-2'>
              Join the Adventure!
            </h1>
            <p className='text-blue-700'>
              Create an account to start your cyber security journey
            </p>
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

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label
                htmlFor='username'
                className='block text-blue-700 font-medium mb-1'
              >
                Username
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <UserIcon className='h-5 w-5 text-blue-400' />
                </div>
                <input
                  id='username'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className='w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='CyberHero123'
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className='text-xs text-blue-600 mt-1'>
                This will be displayed on the leaderboard
              </p>
            </div>

            <div>
              <label
                htmlFor='email'
                className='block text-blue-700 font-medium mb-1'
              >
                Email
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <EnvelopeIcon className='h-5 w-5 text-blue-400' />
                </div>
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='your-email@example.com'
                />
              </div>
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-blue-700 font-medium mb-1'
              >
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <LockClosedIcon className='h-5 w-5 text-blue-400' />
                </div>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='••••••••'
                  minLength={6}
                />
              </div>
              <p className='text-xs text-blue-600 mt-1'>
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-blue-700 font-medium mb-1'
              >
                Confirm Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <LockClosedIcon className='h-5 w-5 text-blue-400' />
                </div>
                <input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className='w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='••••••••'
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className={`btn-primary w-full py-3 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-blue-700'>
              Already have an account?{' '}
              <Link
                href='/auth/login'
                className='text-purple-600 font-bold hover:text-purple-800'
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
