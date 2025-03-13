'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-blue-300 to-purple-300 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-blue-700'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
