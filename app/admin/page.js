'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../components/AdminGuard';
import { adminFetch } from '../../lib/adminFetch';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/solid';

function DashboardContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Users', href: '/admin/users', icon: UsersIcon, color: 'from-blue-500 to-blue-600', stat: stats?.users?.totalUsers },
    { title: 'Feedback', href: '/admin/feedback', icon: EnvelopeIcon, color: 'from-green-500 to-green-600', stat: stats?.feedback?.feedbackCount },
    { title: 'Chat History', href: '/admin/chat', icon: ChatBubbleLeftRightIcon, color: 'from-purple-500 to-purple-600', stat: null },
    { title: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, color: 'from-orange-500 to-orange-600', stat: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CagE Admin
            </h1>
            <p className="text-sm text-gray-500">Dashboard Overview</p>
          </div>
          <Link href="/" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Back to Game
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {cards.map((card) => (
            <Link key={card.title} href={card.href}>
              <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{card.title}</h2>
                {card.stat !== null && card.stat !== undefined && (
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.stat}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        {loading && (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading dashboard stats...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Users Overview */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Users Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-600">Total Users</span><span className="font-bold">{stats.users.totalUsers}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">New This Week</span><span className="font-bold text-green-600">+{stats.users.newUsersThisWeek}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Average Score</span><span className="font-bold">{stats.users.avgScore}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Overall Pass Rate</span><span className="font-bold">{stats.users.overallPassRate}%</span></div>
              </div>
            </div>

            {/* Level Performance */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Level Performance</h3>
              {stats.levels.length === 0 ? (
                <p className="text-gray-500">No gameplay data yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.levels.map((l) => (
                    <div key={l.levelId} className="flex items-center justify-between">
                      <span className="text-gray-600">Level {l.levelId}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{l.attempts} plays</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${l.passRate}%` }} />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{l.passRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.users.scoreBuckets).map(([range, count]) => (
                  <div key={range} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16">{range}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${stats.users.totalUsers > 0 ? (count / stats.users.totalUsers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback Summary */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Feedback</span>
                  <span className="font-bold">{stats.feedback.feedbackCount}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">By Type</p>
                  <div className="flex gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      General: {stats.feedback.typeDist.general}
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      Bugs: {stats.feedback.typeDist.bug}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Features: {stats.feedback.typeDist.feature}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500 mb-2">Ratings</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <div key={r} className="text-center">
                        <div className="text-yellow-400 text-sm">{'⭐'.repeat(r)}</div>
                        <div className="text-xs font-medium text-gray-600">{stats.feedback.ratingDist[r]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
