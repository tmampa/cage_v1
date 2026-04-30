'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  EnvelopeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import AdminGuard from '../../components/AdminGuard';
import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminShell,
  AdminStatCard,
} from '../../components/admin/AdminLayout';
import { adminFetch } from '../../lib/adminFetch';

function DashboardContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Users', href: '/admin/users', icon: UsersIcon, stat: stats?.users?.totalUsers ?? '-', tone: 'blue' },
    { title: 'Feedback', href: '/admin/feedback', icon: EnvelopeIcon, stat: stats?.feedback?.feedbackCount ?? '-', tone: 'green' },
    { title: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon, stat: 'Open', tone: 'amber' },
  ];

  return (
    <AdminShell
      title="Overview"
      description="Monitor learning activity, feedback, and account health from one focused workspace."
    >
      {error && <AdminError message={error} />}

      {loading ? (
        <AdminLoading label="Loading dashboard data..." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.title}</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">{card.stat}</p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                    <card.icon className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <AdminStatCard label="New This Week" value={`+${stats.users.newUsersThisWeek}`} tone="green" icon={UsersIcon} />
                <AdminStatCard label="Average Score" value={stats.users.avgScore} tone="blue" icon={ChartBarIcon} />
                <AdminStatCard label="Pass Rate" value={`${stats.users.overallPassRate}%`} tone="green" icon={ChartBarIcon} />
                <AdminStatCard label="Feedback" value={stats.feedback.feedbackCount} tone="amber" icon={EnvelopeIcon} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AdminPanel title="Level Performance" description="Player attempts and pass rates by level.">
                  {stats.levels.length === 0 ? (
                    <div className="p-5">
                      <AdminEmpty title="No gameplay data yet" />
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {stats.levels.map((level) => (
                        <div key={level.levelId} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Level {level.levelId}</p>
                            <p className="mt-1 text-xs text-slate-500">{level.attempts} attempts</p>
                          </div>
                          <div className="flex min-w-40 items-center gap-3">
                            <div className="h-2 flex-1 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${level.passRate}%` }} />
                            </div>
                            <span className="w-10 text-right text-sm font-semibold text-slate-700">{level.passRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AdminPanel>

                <AdminPanel title="Feedback Summary" description="Current feedback type and rating spread.">
                  <div className="space-y-5 p-5">
                    <div className="flex flex-wrap gap-2">
                      <AdminBadge tone="blue">General: {stats.feedback.typeDist.general}</AdminBadge>
                      <AdminBadge tone="red">Bugs: {stats.feedback.typeDist.bug}</AdminBadge>
                      <AdminBadge tone="green">Features: {stats.feedback.typeDist.feature}</AdminBadge>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.feedback.ratingDist[rating] || 0;
                        const pct = stats.feedback.feedbackCount > 0 ? (count / stats.feedback.feedbackCount) * 100 : 0;
                        return (
                          <div key={rating} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-3 text-sm">
                            <span className="text-slate-500">{rating} star</span>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-2 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-right font-semibold text-slate-700">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AdminPanel>
              </div>

              <AdminPanel title="Score Distribution" description="How player scores are currently grouped.">
                <div className="divide-y divide-slate-100">
                  {Object.entries(stats.users.scoreBuckets).map(([range, count]) => {
                    const pct = stats.users.totalUsers > 0 ? (count / stats.users.totalUsers) * 100 : 0;
                    return (
                      <div key={range} className="grid grid-cols-[5rem_1fr_4rem] items-center gap-4 px-5 py-3 text-sm">
                        <span className="font-medium text-slate-600">{range}</span>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-right font-semibold text-slate-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </AdminPanel>
            </>
          )}
        </div>
      )}
    </AdminShell>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
