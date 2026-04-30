'use client';

import { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import AdminGuard from '../../../components/AdminGuard';
import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminShell,
  AdminStatCard,
} from '../../../components/admin/AdminLayout';
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
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminShell title="Analytics" description="Performance and engagement trends across the learning game.">
        <AdminLoading label="Loading analytics..." />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Analytics" description="Performance and engagement trends across the learning game.">
        <AdminError message={error} />
      </AdminShell>
    );
  }

  const { users, levels, feedback } = data;

  return (
    <AdminShell title="Analytics" description="Track player participation, level outcomes, scores, and feedback quality.">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Total Players" value={users.totalUsers} icon={UsersIcon} tone="blue" />
          <AdminStatCard label="Average Score" value={users.avgScore} icon={ChartBarIcon} tone="slate" />
          <AdminStatCard label="Pass Rate" value={`${users.overallPassRate}%`} icon={ClipboardDocumentCheckIcon} tone="green" />
          <AdminStatCard label="Feedback" value={feedback.feedbackCount} icon={EnvelopeIcon} tone="amber" />
        </div>

        <AdminPanel title="Level Performance" description="Attempts, completions, pass rate, and average score per level.">
          {levels.length === 0 ? (
            <div className="p-5">
              <AdminEmpty title="No gameplay data available yet" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {levels.map((level) => (
                <div key={level.levelId} className="px-5 py-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        Level {level.levelId}: {LEVEL_NAMES[level.levelId] || `Level ${level.levelId}`}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {level.attempts} attempts, {level.completions} completions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <AdminBadge tone={level.passRate >= 70 ? 'green' : level.passRate >= 40 ? 'amber' : 'red'}>
                        {level.passRate}% pass
                      </AdminBadge>
                      <AdminBadge tone="blue">{level.avgScore} avg score</AdminBadge>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <MetricBar label="Pass rate" value={level.passRate} tone="green" suffix="%" />
                    <MetricBar label="Average score" value={Math.min(level.avgScore, 100)} displayValue={level.avgScore} tone="blue" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminPanel title="Score Distribution" description="Player count by total score range.">
            <div className="divide-y divide-slate-100">
              {Object.entries(users.scoreBuckets).map(([range, count]) => {
                const pct = users.totalUsers > 0 ? (count / users.totalUsers) * 100 : 0;
                return (
                  <div key={range} className="grid grid-cols-[5rem_1fr_4.5rem] items-center gap-4 px-5 py-3 text-sm">
                    <span className="font-medium text-slate-600">{range}</span>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-right font-semibold text-slate-900">{count} ({Math.round(pct)}%)</span>
                  </div>
                );
              })}
            </div>
          </AdminPanel>

          <AdminPanel title="Feedback Breakdown" description="Type and rating distribution.">
            <div className="space-y-6 p-5">
              <div className="space-y-3">
                {Object.entries(feedback.typeDist).map(([type, count]) => {
                  const pct = feedback.feedbackCount > 0 ? Math.round((count / feedback.feedbackCount) * 100) : 0;
                  const tone = type === 'bug' ? 'red' : type === 'feature' ? 'green' : 'blue';
                  return (
                    <MetricBar key={type} label={type} value={pct} displayValue={`${count} (${pct}%)`} tone={tone} />
                  );
                })}
              </div>
              <div className="border-t border-slate-200 pt-5">
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = feedback.ratingDist[rating] || 0;
                    const pct = feedback.feedbackCount > 0 ? Math.round((count / feedback.feedbackCount) * 100) : 0;
                    return (
                      <MetricBar key={rating} label={`${rating} star`} value={pct} displayValue={`${count} (${pct}%)`} tone="amber" />
                    );
                  })}
                </div>
              </div>
            </div>
          </AdminPanel>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricBar({ label, value, displayValue, suffix = '', tone = 'slate' }) {
  const colors = {
    slate: 'bg-slate-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
  };

  return (
    <div className="grid grid-cols-[6rem_1fr_4.5rem] items-center gap-3 text-sm">
      <span className="capitalize text-slate-500">{label}</span>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${colors[tone] || colors.slate}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-right font-semibold text-slate-900">{displayValue ?? `${value}${suffix}`}</span>
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
