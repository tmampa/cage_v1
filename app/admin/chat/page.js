'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '../../../components/AdminGuard';
import { adminFetch } from '../../../lib/adminFetch';

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
      .then((data) => setChatUsers(data.chatUsers || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadUserSessions = async (userId) => {
    setSelectedUser(userId);
    setSessionsLoading(true);
    setExpandedSession(null);
    try {
      const data = await adminFetch(`/api/admin/chat?userId=${userId}`);
      setSessions(data.sessions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSessionsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Chat History</h1>
            <p className="text-sm text-gray-500">{chatUsers.length} users with chat data</p>
          </div>
          <Link href="/admin" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading chat data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Users List */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-700">Users</h3>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {chatUsers.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No chat history yet</p>
                ) : (
                  chatUsers.map((cu) => (
                    <button
                      key={cu.userId}
                      onClick={() => loadUserSessions(cu.userId)}
                      className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors ${
                        selectedUser === cu.userId ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-800">{cu.username}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>{cu.sessionCount} sessions</span>
                        <span>{cu.totalMessages} messages</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Sessions & Messages */}
            <div className="lg:col-span-2">
              {!selectedUser ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
                  Select a user to view their chat history
                </div>
              ) : sessionsLoading ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Loading sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
                  No sessions found for this user
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((s) => (
                    <div key={s.sessionId} className="bg-white rounded-2xl shadow-md overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)
                        }
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          Session: {s.sessionId.slice(0, 24)}...
                        </span>
                        <span className="text-sm text-gray-500">{s.messages.length} messages</span>
                      </button>
                      {expandedSession === s.sessionId && (
                        <div className="border-t px-4 py-4 max-h-96 overflow-y-auto space-y-3 bg-gray-50">
                          {s.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl text-sm ${
                                m.role === 'user'
                                  ? 'bg-blue-100 text-blue-800 ml-12'
                                  : 'bg-white text-gray-700 mr-12 border shadow-sm'
                              }`}
                            >
                              <span className="text-xs font-semibold text-gray-400 block mb-1">
                                {m.role === 'user' ? '👤 User' : '🤖 Assistant'}
                              </span>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AdminGuard>
      <ChatContent />
    </AdminGuard>
  );
}
