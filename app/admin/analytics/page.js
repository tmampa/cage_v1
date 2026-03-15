'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../../components/AdminGuard';
import { adminFetch } from '../../../lib/adminFetch';

const LEVEL_NAMES = {
  1: 'Cyber Security Basics',
  2: 'Password Protection',
  3: 'Phishing Attacks',
  4: 'Safe Web Browsing',
  5: 'Social Media Safety',
  6: 'Malware Defense',
};

function AnalyticsContent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 max-w-md">{error}</div>
      </div>
    );
  }

  const { users, levels, feedback } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Learning Analytics</h1>
          <Link href="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg Score', value: users.avgScore, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Pass Rate', value: `${users.overallPassRate}%`, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Feedback', value: feedback.feedbackCount, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-6 text-center`}>
              <p className="text-sm font-medium text-gray-500">{c.label}</p>
              <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Level-by-Level Analysis */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Level Performance</h3>
          {levels.length === 0 ? (
            <p className="text-gray-500">No gameplay data available yet</p>
          ) : (
            <div className="space-y-6">
              {levels.map((l) => (
                <div key={l.levelId} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Level {l.levelId}: {LEVEL_NAMES[l.levelId] || `Level ${l.levelId}`}
                      </h4>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{l.attempts} attempts</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">{l.completions} completions</span>
                    </div>
                  </div>

                  {/* Pass Rate Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Pass Rate</span>
                      <span className="font-medium">{l.passRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          l.passRate >= 70 ? 'bg-green-500' : l.passRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${l.passRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Avg Score Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Avg Score</span>
                      <span className="font-medium">{l.avgScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(l.avgScore, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Score Distribution</h3>
          <div className="space-y-3">
            {Object.entries(users.scoreBuckets).map(([range, count]) => {
              const pct = users.totalUsers > 0 ? (count / users.totalUsers) * 100 : 0;
              return (
                <div key={range} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-20 text-right">{range}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div className="bg-indigo-500 h-4 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium w-12">
                    {count} <span className="text-gray-400">({Math.round(pct)}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type Distribution */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback by Type</h3>
            <div className="space-y-3">
              {Object.entries(feedback.typeDist).map(([type, count]) => {
                const total = feedback.feedbackCount || 1;
                const pct = Math.round((count / total) * 100);
                const colors = { general: 'bg-blue-500', bug: 'bg-red-500', feature: 'bg-green-500' };
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="capitalize text-sm text-gray-600 w-20">{type}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className={`${colors[type]} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium w-14">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = feedback.ratingDist[r] || 0;
                const total = feedback.feedbackCount || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={r} className="flex items-center gap-3">
                    <span className="text-sm text-yellow-400 w-20">{'⭐'.repeat(r)}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium w-14">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AdminGuard>
      <AnalyticsContent />
    </AdminGuard>
  );
}
