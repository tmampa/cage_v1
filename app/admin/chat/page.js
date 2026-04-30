'use client';

import { useEffect, useMemo, useState } from 'react';
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

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleString();
}

function ChatContent() {
  const [chatUsers, setChatUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    adminFetch('/api/admin/chat')
      .then((data) => {
        setChatUsers(data.chatUsers || []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedChatUser = useMemo(
    () => chatUsers.find((user) => user.userId === selectedUser),
    [chatUsers, selectedUser]
  );

  const loadUserSessions = async (userId) => {
    setSelectedUser(userId);
    setSessionsLoading(true);
    setExpandedSession(null);
    try {
      const data = await adminFetch(`/api/admin/chat?userId=${userId}`);
      setSessions(data.sessions || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  return (
    <AdminShell title="Chat History" description="Review stored chatbot sessions from authenticated player accounts.">
      <div className="space-y-6">
        {error && <AdminError message={error} />}

        {loading ? (
          <AdminLoading label="Loading chat data..." />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_1fr]">
            <AdminPanel
              title="Players"
              description={`${chatUsers.length} with chat history`}
            >
              <div className="max-h-[640px] overflow-y-auto">
                {chatUsers.length === 0 ? (
                  <div className="p-5">
                    <AdminEmpty title="No chat history yet" />
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {chatUsers.map((chatUser) => (
                      <button
                        type="button"
                        key={chatUser.userId}
                        onClick={() => loadUserSessions(chatUser.userId)}
                        className={`w-full px-5 py-4 text-left transition ${
                          selectedUser === chatUser.userId
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-semibold ${selectedUser === chatUser.userId ? 'text-white' : 'text-slate-950'}`}>
                              {chatUser.username}
                            </p>
                            <p className={`mt-1 text-xs ${selectedUser === chatUser.userId ? 'text-slate-300' : 'text-slate-500'}`}>
                              {formatDate(chatUser.lastMessageAt)}
                            </p>
                          </div>
                          <span className={`text-xs font-medium ${selectedUser === chatUser.userId ? 'text-slate-200' : 'text-slate-500'}`}>
                            {chatUser.totalMessages}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <span className={`rounded-md px-2 py-1 text-xs ${selectedUser === chatUser.userId ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {chatUser.sessionCount} sessions
                          </span>
                          <span className={`rounded-md px-2 py-1 text-xs ${selectedUser === chatUser.userId ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {chatUser.totalMessages} messages
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </AdminPanel>

            <div>
              {!selectedUser ? (
                <AdminEmpty title="Select a player" description="Choose a player to inspect their chatbot sessions." />
              ) : sessionsLoading ? (
                <AdminLoading label="Loading sessions..." />
              ) : sessions.length === 0 ? (
                <AdminEmpty title="No sessions found" description="This player does not have stored chat messages." />
              ) : (
                <AdminPanel
                  title={selectedChatUser?.username || 'Chat sessions'}
                  description={`${sessions.length} sessions, ${selectedChatUser?.totalMessages || 0} messages`}
                >
                  <div className="divide-y divide-slate-100">
                    {sessions.map((session) => (
                      <div key={session.sessionId}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSession(expandedSession === session.sessionId ? null : session.sessionId)
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-slate-950">
                              Session {session.sessionId.slice(0, 24)}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {formatDate(session.lastMessageAt)}
                            </span>
                          </span>
                          <AdminBadge tone="slate">{session.messages.length} messages</AdminBadge>
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
                                <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                  {message.role === 'user' ? 'User' : 'Assistant'}
                                </span>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AdminPanel>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default function ChatPage() {
  return (
    <AdminGuard>
      <ChatContent />
    </AdminGuard>
  );
}
