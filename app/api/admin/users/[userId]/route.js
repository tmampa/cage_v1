import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db.js';
import { users, levelProgress, feedback } from '../../../../../db/schema.js';
import { verifyAdmin } from '../../../../../lib/verifyAdmin.js';
import { getChatSessionsForUser } from '../../../../../lib/chatHistory.js';
import { and, eq } from 'drizzle-orm';

export async function GET(request, { params }) {
  try {
    await verifyAdmin(request);

    const { userId } = await params;
    const uid = Number(userId);

    // User profile
    const [user] = await db
      .select({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        isAdmin:     users.isAdmin,
        createdAt:   users.createdAt,
      })
      .from(users)
      .where(and(eq(users.id, uid), eq(users.isAdmin, false)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Level progress
    const levelProgressRows = await db
      .select()
      .from(levelProgress)
      .where(eq(levelProgress.userId, uid));

    // Unlocked levels (derived: level n+1 unlocked when level n completed)
    const completedIds = levelProgressRows.filter(p => p.completed).map(p => p.levelId);
    const highestCompleted = completedIds.length > 0 ? Math.max(...completedIds) : 0;
    const unlockedLevels = Array.from({ length: Math.min(highestCompleted + 1, 6) }, (_, i) => i + 1);

    // Feedback submitted by user
    const userFeedback = await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, uid));
    const chatSessions = await getChatSessionsForUser(uid);

    return NextResponse.json({
      user,
      levelProgress: levelProgressRows,
      unlockedLevels,
      feedback: userFeedback,
      chatSessions,
    });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
