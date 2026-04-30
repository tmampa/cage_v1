import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../lib/db.js';
import { levelProgress, users } from '../../../db/schema.js';
import { verifyJWT, COOKIE_NAME } from '../../../lib/auth.js';
import { eq, and, sql } from 'drizzle-orm';

// GET — fetch current user's level progress
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ progress: [] });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ progress: [] });
    if (payload.isAdmin) return NextResponse.json({ progress: [] });

    const userId = Number(payload.sub);

    const progress = await db
      .select()
      .from(levelProgress)
      .where(eq(levelProgress.userId, userId));

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ progress: [] });
  }
}

// POST — save level progress, recalculate total score, unlock next level
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.isAdmin) {
      return NextResponse.json({ success: true, totalScore: 0, skipped: true });
    }

    const userId = Number(payload.sub);
    const { levelId, score, completed } = await request.json();

    if (typeof levelId !== 'number' || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid data.' }, { status: 400 });
    }

    // Upsert progress — only improve score if already completed
    const existing = await db
      .select()
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, userId), eq(levelProgress.levelId, levelId)))
      .limit(1);

    if (existing.length > 0) {
      const shouldUpdate = !existing[0].completed || score > existing[0].score;
      if (shouldUpdate) {
        await db
          .update(levelProgress)
          .set({ score, completed: completed || existing[0].completed, lastPlayedAt: new Date() })
          .where(and(eq(levelProgress.userId, userId), eq(levelProgress.levelId, levelId)));
      }
    } else {
      await db.insert(levelProgress).values({ userId, levelId, score, completed });
    }

    // Recalculate total score from all completed levels
    const result = await db
      .select({ total: sql`COALESCE(SUM(${levelProgress.score}), 0)` })
      .from(levelProgress)
      .where(and(eq(levelProgress.userId, userId), eq(levelProgress.completed, true)));

    const totalScore = Number(result[0]?.total ?? 0);

    await db
      .update(users)
      .set({ score: totalScore })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, totalScore });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 });
  }
}
