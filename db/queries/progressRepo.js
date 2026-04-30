import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { levelProgress } from '../schema.js';

/**
 * All progress rows for a single user.
 */
export async function getProgressByUserId(userId) {
  return db
    .select()
    .from(levelProgress)
    .where(eq(levelProgress.userId, Number(userId)));
}

/**
 * The single progress row for a (userId, levelId) pair, if any.
 */
export async function getProgressEntry(userId, levelId) {
  const [row] = await db
    .select()
    .from(levelProgress)
    .where(
      and(
        eq(levelProgress.userId, Number(userId)),
        eq(levelProgress.levelId, Number(levelId))
      )
    )
    .limit(1);
  return row || null;
}

/**
 * Upsert progress for a user/level pair, only improving the score
 * if the level was already completed. Mirrors the previous inline logic
 * in `app/api/progress/route.js`.
 */
export async function upsertProgressWithBestScore({ userId, levelId, score, completed }) {
  const existing = await getProgressEntry(userId, levelId);

  if (existing) {
    const shouldUpdate = !existing.completed || score > existing.score;
    if (shouldUpdate) {
      await db
        .update(levelProgress)
        .set({
          score,
          completed: completed || existing.completed,
          lastPlayedAt: new Date(),
        })
        .where(
          and(
            eq(levelProgress.userId, Number(userId)),
            eq(levelProgress.levelId, Number(levelId))
          )
        );
    }
    return;
  }

  await db.insert(levelProgress).values({
    userId: Number(userId),
    levelId: Number(levelId),
    score,
    completed,
  });
}

/**
 * Sum the score of all completed levels for a user.
 */
export async function sumCompletedScore(userId) {
  const result = await db
    .select({ total: sql`COALESCE(SUM(${levelProgress.score}), 0)` })
    .from(levelProgress)
    .where(
      and(
        eq(levelProgress.userId, Number(userId)),
        eq(levelProgress.completed, true)
      )
    );
  return Number(result[0]?.total ?? 0);
}

/**
 * Progress rows for many users — used by admin/users and analytics aggregations.
 */
export async function getProgressForUsers(userIds) {
  if (userIds.length === 0) return [];
  return db
    .select()
    .from(levelProgress)
    .where(inArray(levelProgress.userId, userIds.map(Number)));
}
