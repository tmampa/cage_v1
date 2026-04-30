'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps admin-only pages. Redirects non-admins to home.
 */
export default function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const authorized = Boolean(user?.isAdmin);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!user.isAdmin) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-purple-700 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
}
