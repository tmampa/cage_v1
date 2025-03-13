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
} from '@heroicons/react/24/solid';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
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
              Welcome Back!
            </h1>
            <p className='text-blue-700'>
              Sign in to continue your cyber security adventure
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
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-blue-700'>
              Don't have an account?{' '}
              <Link
                href='/auth/register'
                className='text-purple-600 font-bold hover:text-purple-800'
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className='mt-4'>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className='w-full btn-secondary flex items-center justify-center'
            >
              <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                <path
                  fill='currentColor'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='currentColor'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='currentColor'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='currentColor'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
