'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '../../../../components/AdminGuard';
import { adminFetch } from '../../../../lib/adminFetch';

const LEVEL_NAMES = {
  1: 'Cyber Security Basics',
  2: 'Password Protection',
  3: 'Phishing Attacks',
  4: 'Safe Web Browsing',
  5: 'Social Media Safety',
  6: 'Malware Defense',
};

function UserDetailContent() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    adminFetch(`/api/admin/users/${userId}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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

  const { user, levelProgress, unlockedLevels, feedback, chatSessions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">User Detail</h1>
          <Link href="/admin/users" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← All Users
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 flex items-center gap-6">
          <span className="text-5xl">{user.avatar_emoji || '👤'}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                Score: {user.score || 0}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                Unlocked: {unlockedLevels.length}/6
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Level Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((lid) => {
              const prog = levelProgress.find((p) => (p.levelId || p.level_id) === lid);
              const unlocked = unlockedLevels.includes(lid);
              const passed = prog?.passed || prog?.completed;
              return (
                <div key={lid} className={`border rounded-xl p-4 ${passed ? 'border-green-300 bg-green-50' : unlocked ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="font-medium text-gray-800">Level {lid}: {LEVEL_NAMES[lid]}</p>
                  {prog ? (
                    <div className="mt-2 text-sm space-y-1">
                      <p>Score: <span className="font-semibold">{prog.score}</span></p>
                      <p>Status: {passed ? <span className="text-green-600 font-medium">Completed ✓</span> : <span className="text-yellow-600 font-medium">In Progress</span>}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">{unlocked ? 'Not attempted' : 'Locked'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Feedback ({feedback.length})</h3>
          {feedback.length === 0 ? (
            <p className="text-gray-500">No feedback submitted</p>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      f.feedbackType === 'bug' ? 'bg-red-100 text-red-700' : f.feedbackType === 'feature' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{f.feedbackType}</span>
                    <span className="text-yellow-400 text-sm">{'⭐'.repeat(f.rating || 0)}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded ${f.resolved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {f.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Sessions */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Sessions ({chatSessions.length})</h3>
          {chatSessions.length === 0 ? (
            <p className="text-gray-500">No chat history</p>
          ) : (
            <div className="space-y-3">
              {chatSessions.map((s) => (
                <div key={s.sessionId} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      Session: {s.sessionId.slice(0, 20)}...
                    </span>
                    <span className="text-sm text-gray-500">{s.messageCount} messages</span>
                  </button>
                  {expandedSession === s.sessionId && (
                    <div className="border-t px-4 py-3 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
                      {s.messages.map((m) => (
                        <div key={m.id} className={`text-sm p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-100 text-blue-800 ml-8' : 'bg-white text-gray-700 mr-8 border'}`}>
                          <span className="text-xs font-medium text-gray-500 block mb-1">{m.role}</span>
                          {m.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <AdminGuard>
      <UserDetailContent />
    </AdminGuard>
  );
}
