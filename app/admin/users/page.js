'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../../components/AdminGuard';
import { adminFetch } from '../../../lib/adminFetch';

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    setLoading(true);
    adminFetch(`/api/admin/users?sortBy=${sortBy}&order=${order}&search=${encodeURIComponent(search)}`)
      .then((data) => setUsers(data.users || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sortBy, order, search]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const sortIndicator = (field) => {
    if (sortBy !== field) return '';
    return order === 'desc' ? ' ↓' : ' ↑';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500">{users.length} users found</p>
          </div>
          <Link href="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
          />
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-purple-600" onClick={() => toggleSort('score')}>
                      Score{sortIndicator('score')}
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Levels</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last Played</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{u.avatar_emoji || '👤'}</span>
                          <div>
                            <p className="font-medium text-gray-800">{u.username}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{u.score || 0}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                          {u.levelsCompleted}/6
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.lastPlayed ? new Date(u.lastPlayed).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UsersPage() {
  return (
    <AdminGuard>
      <UsersContent />
    </AdminGuard>
  );
}
