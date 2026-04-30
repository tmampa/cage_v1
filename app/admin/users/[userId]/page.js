'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '../../../../components/AdminGuard';
import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPanel,
  AdminShell,
  AdminStatCard,
} from '../../../../components/admin/AdminLayout';
import { adminFetch } from '../../../../lib/adminFetch';
import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const LEVEL_NAMES = {
  1: 'Cyber Security Basics',
  2: 'Password Protection',
  3: 'Phishing Attacks',
  4: 'Safe Web Browsing',
  5: 'Social Media Safety',
  6: 'Malware Defense',
};

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

function UserDetailContent() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    adminFetch(`/api/admin/users/${userId}`)
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <AdminShell title="User Detail" description="Inspect player progress, submitted feedback, and chat history.">
        <AdminLoading label="Loading user detail..." />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="User Detail" description="Inspect player progress, submitted feedback, and chat history.">
        <AdminError message={error} />
      </AdminShell>
    );
  }

  const { user, levelProgress, unlockedLevels, feedback, chatSessions } = data;
  const completedLevels = levelProgress.filter((progress) => progress.completed).length;

  return (
    <AdminShell
      title={user.username}
      description={`Player ID ${user.id}. Account created ${formatDate(user.createdAt)}.`}
      actions={
        <Link
          href="/admin/users"
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          All users
        </Link>
      }
    >
      <div className="space-y-6">
        <AdminPanel>
          <div className="flex flex-wrap items-center gap-5 p-5">
            <span className="grid h-16 w-16 place-items-center rounded-lg bg-slate-100 text-4xl">
              {user.avatarEmoji || '👤'}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-950">{user.username}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminBadge tone="blue">Score: {user.score || 0}</AdminBadge>
                <AdminBadge tone="green">Completed: {completedLevels}/6</AdminBadge>
                <AdminBadge tone="slate">Unlocked: {unlockedLevels.length}/6</AdminBadge>
              </div>
            </div>
          </div>
        </AdminPanel>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Score" value={user.score || 0} icon={TrophyIcon} tone="amber" />
          <AdminStatCard label="Completed Levels" value={`${completedLevels}/6`} icon={ClipboardDocumentCheckIcon} tone="green" />
          <AdminStatCard label="Feedback" value={feedback.length} icon={EnvelopeIcon} tone="blue" />
          <AdminStatCard label="Chat Sessions" value={chatSessions.length} icon={ChatBubbleLeftRightIcon} tone="slate" />
        </div>

        <AdminPanel title="Level Progress" description="Current progress for each learning level.">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((levelId) => {
              const progress = levelProgress.find((item) => (item.levelId || item.level_id) === levelId);
              const unlocked = unlockedLevels.includes(levelId);
              const completed = progress?.passed || progress?.completed;
              const tone = completed ? 'green' : unlocked ? 'blue' : 'slate';

              return (
                <div key={levelId} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Level {levelId}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{LEVEL_NAMES[levelId]}</p>
                    </div>
                    <AdminBadge tone={tone}>{completed ? 'Completed' : unlocked ? 'Unlocked' : 'Locked'}</AdminBadge>
                  </div>
                  {progress ? (
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Score: <span className="font-semibold text-slate-950">{progress.score}</span></p>
                      <p>Last played: {formatDate(progress.lastPlayedAt)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">{unlocked ? 'Not attempted' : 'Unavailable until prior levels are completed'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title={`Feedback (${feedback.length})`} description="Messages submitted by this player.">
          {feedback.length === 0 ? (
            <div className="p-5">
              <AdminEmpty title="No feedback submitted" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedback.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <AdminBadge tone={item.feedbackType === 'bug' ? 'red' : item.feedbackType === 'feature' ? 'green' : 'blue'}>
                      {item.feedbackType}
                    </AdminBadge>
                    <span className="text-sm text-amber-500">{'★'.repeat(item.rating || 0)}</span>
                    <AdminBadge tone={item.resolved ? 'green' : 'amber'}>{item.resolved ? 'Resolved' : 'Open'}</AdminBadge>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title={`Chat Sessions (${chatSessions.length})`} description="Stored chatbot conversations for this player.">
          {chatSessions.length === 0 ? (
            <div className="p-5">
              <AdminEmpty title="No chat history" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {chatSessions.map((session) => (
                <div key={session.sessionId}>
                  <button
                    type="button"
                    onClick={() => setExpandedSession(expandedSession === session.sessionId ? null : session.sessionId)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">
                        Session {session.sessionId.slice(0, 20)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{formatDate(session.lastMessageAt)}</span>
                    </span>
                    <AdminBadge tone="slate">{session.messageCount} messages</AdminBadge>
                  </button>
                  {expandedSession === session.sessionId && (
                    <div className="space-y-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                      {session.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-3xl rounded-lg border px-4 py-3 text-sm leading-6 ${
                            message.role === 'user'
                              ? 'ml-auto border-blue-200 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{message.role}</span>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminShell>
  );
}

export default function UserDetailPage() {
  return (
    <AdminGuard>
      <UserDetailContent />
    </AdminGuard>
  );
}
