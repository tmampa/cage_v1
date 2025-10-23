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
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/solid';
import EnhancedButton from '../../../components/EnhancedButton';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full pl-10 pr-12 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors'
                >
                  {showPassword ? (
                    <EyeSlashIcon className='h-5 w-5' />
                  ) : (
                    <EyeIcon className='h-5 w-5' />
                  )}
                </button>
              </div>
            </div>

            <EnhancedButton
              type='submit'
              disabled={loading}
              variant="primary"
              size="large"
              className="w-full"
              icon={loading ? null : <ShieldCheckIcon className="w-5 h-5" />}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging In...
                </div>
              ) : (
                'Login to CagE'
              )}
            </EnhancedButton>
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
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Or continue with</span>
              </div>
            </div>
            
            <div className='mt-4'>
              <EnhancedButton
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="ghost"
                size="large"
                className="w-full border-2 border-gray-300 hover:border-blue-400"
                icon={
                  <svg className='w-5 h-5' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                }
              >
                Continue with Google
              </EnhancedButton>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
