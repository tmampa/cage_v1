'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import AdminGuard from '../../../components/AdminGuard';
import {
  AdminError,
  AdminLoading,
  AdminShell,
} from '../../../components/admin/AdminLayout';
import { adminFetch } from '../../../lib/adminFetch';

const EXPORT_TYPES = [
  {
    key: 'users',
    label: 'Users',
    description: 'Player accounts, scores, avatars, and join dates.',
    icon: UsersIcon,
    tone: 'blue',
    statKey: 'usersCount',
  },
  {
    key: 'level_progress',
    label: 'Level Progress',
    description: 'Per-user level completion, scores, and last played timestamps.',
    icon: ClipboardDocumentListIcon,
    tone: 'green',
    statKey: 'levelProgressCount',
  },
  {
    key: 'feedback',
    label: 'Feedback',
    description: 'Player feedback entries with types, ratings, and resolution status.',
    icon: EnvelopeIcon,
    tone: 'amber',
    statKey: 'feedbackCount',
  },
  {
    key: 'chat',
    label: 'Chat Messages',
    description: 'Chatbot conversation history across all player sessions.',
    icon: ChatBubbleLeftRightIcon,
    tone: 'purple',
    statKey: 'chatCount',
  },
];

const TONE_CLASSES = {
  blue:   { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', ring: 'ring-blue-200', accent: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-400' },
  green:  { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-200', accent: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-400' },
  amber:  { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', ring: 'ring-amber-200', accent: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-400' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', ring: 'ring-purple-200', accent: 'bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-400' },
};

function ExportContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({}); // { [key]: 'idle' | 'loading' | 'done' }

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then((data) => {
        setStats({
          usersCount: data.users?.totalUsers ?? '—',
          levelProgressCount: data.levels?.reduce((s, l) => s + l.attempts, 0) ?? '—',
          feedbackCount: data.feedback?.feedbackCount ?? '—',
          chatCount: '—', // analytics API doesn't expose chat count
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (type) => {
    setDownloading((prev) => ({ ...prev, [type]: 'loading' }));
    try {
      const res = await fetch(`/api/admin/export?type=${type}`, { credentials: 'include' });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      // Extract filename from Content-Disposition header
      const cd = res.headers.get('content-disposition') || '';
      const filenameMatch = cd.match(/filename="?(.+?)"?$/);
      a.download = filenameMatch ? filenameMatch[1] : `cage_${type}_export.xlsx`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloading((prev) => ({ ...prev, [type]: 'done' }));
      setTimeout(() => setDownloading((prev) => ({ ...prev, [type]: 'idle' })), 2500);
    } catch (err) {
      setError(err.message);
      setDownloading((prev) => ({ ...prev, [type]: 'idle' }));
    }
  };

  const handleExportAll = () => handleDownload('all');

  return (
    <AdminShell
      title="Export Data"
      description="Download game data as professionally formatted Excel spreadsheets."
    >
      <div className="space-y-6">
        {error && <AdminError message={error} />}

        {loading ? (
          <AdminLoading label="Loading export options..." />
        ) : (
          <>
            {/* Export All banner */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-lg sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Full Data Export</h2>
                  <p className="mt-1 max-w-md text-sm leading-6 text-slate-400">
                    Download a single Excel workbook with all data tables as separate sheets —
                    users, level progress, feedback, and chat messages.
                  </p>
                </div>
                <button
                  onClick={handleExportAll}
                  disabled={downloading.all === 'loading'}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-wait disabled:opacity-70"
                >
                  {downloading.all === 'loading' ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      Generating…
                    </>
                  ) : downloading.all === 'done' ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      Export All (.xlsx)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Individual export cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {EXPORT_TYPES.map((item) => {
                const tone = TONE_CLASSES[item.tone] || TONE_CLASSES.blue;
                const Icon = item.icon;
                const state = downloading[item.key] || 'idle';

                return (
                  <div
                    key={item.key}
                    className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-4 flex items-start justify-between">
                        <span className={`grid h-11 w-11 place-items-center rounded-lg ${tone.icon}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                          {stats?.[item.statKey] ?? '—'} records
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-950">{item.label}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                    </div>

                    <div className="mt-5">
                      <button
                        onClick={() => handleDownload(item.key)}
                        disabled={state === 'loading'}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${tone.accent}`}
                      >
                        {state === 'loading' ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Generating…
                          </>
                        ) : state === 'done' ? (
                          <>
                            <CheckCircleIcon className="h-5 w-5" />
                            Downloaded!
                          </>
                        ) : (
                          <>
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Download .xlsx
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info note */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-700">Formatting note:</span>{' '}
                Each spreadsheet includes styled headers, auto-sized columns, alternating row
                colours, frozen header rows, and auto-filters for easy sorting and analysis.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

export default function ExportPage() {
  return (
    <AdminGuard>
      <ExportContent />
    </AdminGuard>
  );
}
