import { desc, eq } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { feedback, users } from '../schema.js';

/**
 * Insert a new feedback entry.
 */
export async function createFeedback({ userId, username, feedbackType, rating, message }) {
  await db.insert(feedback).values({
    userId,
    username,
    feedbackType,
    rating,
    message,
  });
}

/**
 * Fetch the most-recent feedback rows joined with the submitting user's score,
 * then apply optional client-side `type`/`status` filters in JS.
 *
 * Note: filters happen in JS to preserve the previous behavior; the SQL is
 * unchanged (selects up to `limit` rows ordered by recency).
 */
export async function listFeedbackWithUser({ limit, type, status }) {
  let rows = await db
    .select({
      id:           feedback.id,
      userId:       feedback.userId,
      username:     feedback.username,
      feedbackType: feedback.feedbackType,
      rating:       feedback.rating,
      message:      feedback.message,
      resolved:     feedback.resolved,
      createdAt:    feedback.createdAt,
      userScore:    users.score,
    })
    .from(feedback)
    .leftJoin(users, eq(feedback.userId, users.id))
    .orderBy(desc(feedback.createdAt))
    .limit(limit);

  if (type && type !== 'all') {
    rows = rows.filter((f) => f.feedbackType === type);
  }
  if (status === 'resolved') {
    rows = rows.filter((f) => f.resolved === true);
  } else if (status === 'unresolved') {
    rows = rows.filter((f) => !f.resolved);
  }

  return rows;
}

/**
 * Mark a single feedback row as resolved/unresolved.
 */
export async function markFeedbackResolved(feedbackId, resolved) {
  await db
    .update(feedback)
    .set({ resolved })
    .where(eq(feedback.id, Number(feedbackId)));
}

/**
 * Feedback rows submitted by a specific user.
 */
export async function getFeedbackByUserId(userId) {
  return db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, Number(userId)));
}

/**
 * All feedback rows — used by analytics aggregation.
 */
export async function getAllFeedback() {
  return db.select().from(feedback);
}
