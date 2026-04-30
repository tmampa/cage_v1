'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminShell,
} from '../../../components/admin/AdminLayout';
import { adminFetch } from '../../../lib/adminFetch';

function FeedbackContent() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    adminFetch(`/api/admin/feedback?type=${filterType}&status=${filterStatus}`)
      .then((data) => {
        if (!cancelled) {
          setFeedback(data.feedback || []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterType, filterStatus]);

  const handleTypeChange = (value) => {
    setLoading(true);
    setFilterType(value);
  };

  const handleStatusChange = (value) => {
    setLoading(true);
    setFilterStatus(value);
  };

  const toggleResolved = async (id, currentResolved) => {
    try {
      await adminFetch('/api/admin/feedback', {
        method: 'PATCH',
        body: JSON.stringify({ feedbackId: id, resolved: !currentResolved }),
      });
      setFeedback((prev) =>
        prev.map((item) => (item.id === id ? { ...item, resolved: !currentResolved } : item))
      );
    } catch (e) {
      setError(`Failed to update feedback: ${e.message}`);
    }
  };

  const formatSubmittedAt = (createdAt) => {
    if (!createdAt) return 'Unknown';

    const timestamp = createdAt?._seconds
      ? new Date(createdAt._seconds * 1000)
      : new Date(createdAt);

    return Number.isNaN(timestamp.getTime()) ? 'Unknown' : timestamp.toLocaleString();
  };

  const typeTone = (type) => {
    if (type === 'bug') return 'red';
    if (type === 'feature') return 'green';
    return 'blue';
  };

  return (
    <AdminShell title="Feedback" description="Review player feedback, filter by type or status, and track resolution.">
      <div className="space-y-6">
        <AdminPanel>
          <div className="flex flex-wrap items-end gap-4 p-5">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              <span>Type</span>
              <select
                value={filterType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All types</option>
                <option value="general">General</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                value={filterStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All</option>
                <option value="unresolved">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <AdminBadge tone="slate">{feedback.length} items</AdminBadge>
          </div>
        </AdminPanel>

        {error && <AdminError message={error} />}

        {loading ? (
          <AdminLoading label="Loading feedback..." />
        ) : feedback.length === 0 ? (
          <AdminEmpty title="No feedback found" description="Try a different filter combination." />
        ) : (
          <AdminPanel>
            <div className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="grid w-full grid-cols-1 gap-3 px-5 py-4 text-left transition hover:bg-slate-50 lg:grid-cols-[8rem_6rem_1fr_9rem_6rem]"
                  >
                    <AdminBadge tone={typeTone(item.feedbackType)}>{item.feedbackType}</AdminBadge>
                    <span className="text-sm font-medium text-amber-500">{'★'.repeat(item.rating || 0) || 'No rating'}</span>
                    <span className="min-w-0 truncate text-sm text-slate-700">{item.message}</span>
                    <span className="text-sm text-slate-500">{item.username || 'Anonymous'}</span>
                    <AdminBadge tone={item.resolved ? 'green' : 'amber'}>{item.resolved ? 'Resolved' : 'Open'}</AdminBadge>
                  </button>

                  {expandedId === item.id && (
                    <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="max-w-4xl text-sm leading-6 text-slate-700">{item.message}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        <span>User: {item.username || 'Anonymous'}</span>
                        {item.userScore !== null && item.userScore !== undefined && (
                          <span>User Score: {item.userScore}</span>
                        )}
                        <span>Submitted: {formatSubmittedAt(item.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleResolved(item.id, item.resolved)}
                        className={`mt-4 rounded-md px-3 py-2 text-sm font-medium transition ${
                          item.resolved
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {item.resolved ? 'Reopen' : 'Mark resolved'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AdminPanel>
        )}
      </div>
    </AdminShell>
  );
}

export default function FeedbackPage() {
  return (
    <AdminGuard>
      <FeedbackContent />
    </AdminGuard>
  );
}
