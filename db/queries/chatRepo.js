import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { chatMessages, users } from '../schema.js';

const MAX_CHAT_ROWS = 5000;

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function buildChatSessions(rows) {
  const sessions = new Map();

  rows.forEach((row) => {
    const sessionId = row.sessionId;
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        sessionId,
        messages: [],
        startedAt: toIso(row.createdAt),
        lastMessageAt: toIso(row.createdAt),
      });
    }

    const session = sessions.get(sessionId);
    const createdAt = toIso(row.createdAt);

    session.messages.push({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: createdAt,
      createdAt,
    });
    session.lastMessageAt = createdAt;
  });

  return Array.from(sessions.values())
    .map((session) => ({
      ...session,
      messageCount: session.messages.length,
    }))
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

/**
 * Aggregate chat-history summaries per non-admin user (admin chat dashboard).
 */
export async function getChatUsersWithHistory() {
  const rows = await db
    .select({
      id:        chatMessages.id,
      userId:    users.id,
      username:  users.username,
      sessionId: chatMessages.sessionId,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(users.isAdmin, false))
    .orderBy(desc(chatMessages.createdAt))
    .limit(MAX_CHAT_ROWS);

  const summaries = new Map();

  rows.forEach((row) => {
    if (!summaries.has(row.userId)) {
      summaries.set(row.userId, {
        userId: row.userId,
        username: row.username,
        sessionIds: new Set(),
        sessionCount: 0,
        totalMessages: 0,
        lastMessageAt: toIso(row.createdAt),
      });
    }

    const summary = summaries.get(row.userId);
    summary.sessionIds.add(row.sessionId);
    summary.totalMessages += 1;
  });

  return Array.from(summaries.values()).map(({ sessionIds, ...summary }) => ({
    ...summary,
    sessionCount: sessionIds.size,
  }));
}

/**
 * All chat messages for a non-admin user, grouped into sessions.
 */
export async function getChatSessionsForUser(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return [];

  const rows = await db
    .select({
      id:        chatMessages.id,
      sessionId: chatMessages.sessionId,
      role:      chatMessages.role,
      content:   chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(and(eq(users.id, uid), eq(users.isAdmin, false)))
    .orderBy(asc(chatMessages.createdAt))
    .limit(MAX_CHAT_ROWS);

  return buildChatSessions(rows);
}

/**
 * Persist a single chat message. Errors are swallowed at the call site
 * so chat replies never fail because of a logging failure.
 */
export async function insertChatMessage({ userId, sessionId, role, content }) {
  await db.insert(chatMessages).values({
    userId,
    sessionId,
    role,
    content,
  });
}
