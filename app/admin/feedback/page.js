'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../../components/AdminGuard';
import { adminFetch } from '../../../lib/adminFetch';

function FeedbackContent() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchFeedback = () => {
    setLoading(true);
    adminFetch(`/api/admin/feedback?type=${filterType}&status=${filterStatus}`)
      .then((data) => setFeedback(data.feedback || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, [filterType, filterStatus]);

  const toggleResolved = async (id, currentResolved) => {
    try {
      await adminFetch('/api/admin/feedback', {
        method: 'PATCH',
        body: JSON.stringify({ feedbackId: id, resolved: !currentResolved }),
      });
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, resolved: !currentResolved } : f))
      );
    } catch (e) {
      alert('Failed to update: ' + e.message);
    }
  };

  const typeBadge = (type) => {
    const styles = {
      bug: 'bg-red-100 text-red-700',
      feature: 'bg-green-100 text-green-700',
      general: 'bg-blue-100 text-blue-700',
    };
    return styles[type] || styles.general;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Feedback Management</h1>
            <p className="text-sm text-gray-500">{feedback.length} items</p>
          </div>
          <Link href="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
            >
              <option value="all">All</option>
              <option value="unresolved">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No feedback found</div>
        ) : (
          <div className="space-y-4">
            {feedback.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge(f.feedbackType)}`}>
                    {f.feedbackType}
                  </span>
                  <span className="text-yellow-400 text-sm min-w-[60px]">{'⭐'.repeat(f.rating || 0)}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{f.message}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {f.username || 'Anonymous'}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      f.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {f.resolved ? 'Resolved' : 'Open'}
                  </span>
                </button>

                {/* Expanded details */}
                {expandedId === f.id && (
                  <div className="border-t px-6 py-4 bg-gray-50 space-y-3">
                    <p className="text-gray-700">{f.message}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Email: {f.email}</span>
                      <span>User Score: {f.userScoreAtTime}</span>
                      <span>
                        Submitted:{' '}
                        {f.createdAt?._seconds
                          ? new Date(f.createdAt._seconds * 1000).toLocaleString()
                          : 'Unknown'}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleResolved(f.id, f.resolved)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        f.resolved
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {f.resolved ? 'Reopen' : 'Mark Resolved'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <AdminGuard>
      <FeedbackContent />
    </AdminGuard>
  );
}
