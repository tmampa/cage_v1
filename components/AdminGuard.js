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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 [font-family:ui-sans-serif,system-ui,sans-serif]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
}
