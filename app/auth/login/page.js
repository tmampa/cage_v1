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
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/solid';
import EnhancedButton from '../../../components/EnhancedButton';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username.trim(), password);
      router.push(user?.isAdmin ? '/admin' : '/game/levels');
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
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
        <Link href='/' className='text-blue-700 hover:text-blue-900 flex items-center'>
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
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className='inline-block'
            >
              <ShieldCheckIcon className='h-16 w-16 text-blue-500 mx-auto mb-4' />
            </motion.div>
            <h1 className='text-3xl font-bold text-purple-700 mb-2'>Welcome Back!</h1>
            <p className='text-blue-700'>Sign in to continue your cyber security adventure</p>
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
            {/* Username */}
            <div>
              <label htmlFor='username' className='block text-blue-700 font-medium mb-1'>
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
                  autoComplete='username'
                  className='w-full pl-10 pr-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='CyberHero123'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor='password' className='block text-blue-700 font-medium mb-1'>
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
                  autoComplete='current-password'
                  className='w-full pl-10 pr-12 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors'
                >
                  {showPassword ? <EyeSlashIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
                </button>
              </div>
            </div>

            <EnhancedButton
              type='submit'
              disabled={loading}
              variant='primary'
              size='large'
              className='w-full'
              icon={loading ? null : <ShieldCheckIcon className='w-5 h-5' />}
            >
              {loading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Logging In...
                </div>
              ) : (
                'Login to CagE'
              )}
            </EnhancedButton>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-blue-700'>
              Don&apos;t have an account?{' '}
              <Link href='/auth/register' className='text-purple-600 font-bold hover:text-purple-800'>
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
