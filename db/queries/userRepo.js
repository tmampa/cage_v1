import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import { db } from '../../lib/db.js';
import { users } from '../schema.js';

const SAFE_USER_COLS = {
  id:          users.id,
  username:    users.username,
  avatarEmoji: users.avatarEmoji,
  score:       users.score,
  isAdmin:     users.isAdmin,
  createdAt:   users.createdAt,
};

/**
 * Find a user by case-folded username.
 * Returns the full row (including passwordHash) — only used for auth flows.
 */
export async function findUserByUsername(usernameLower) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, usernameLower))
    .limit(1);
  return user || null;
}

/**
 * Insert a new user and return the public-safe row.
 */
export async function createUser({ usernameLower, passwordHash, isAdmin }) {
  const [newUser] = await db
    .insert(users)
    .values({
      username:    usernameLower,
      passwordHash,
      avatarEmoji: '👤',
      score:       0,
      isAdmin,
    })
    .returning(SAFE_USER_COLS);
  return newUser;
}

/**
 * Find a user by id, returning only the public-safe columns.
 */
export async function findSafeUserById(id) {
  const [user] = await db
    .select(SAFE_USER_COLS)
    .from(users)
    .where(eq(users.id, Number(id)))
    .limit(1);
  return user || null;
}

/**
 * Find a user by id, returning only `id` and `isAdmin` — used by chat persistence.
 */
export async function findUserAuthSummaryById(id) {
  const [user] = await db
    .select({ id: users.id, isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, Number(id)))
    .limit(1);
  return user || null;
}

/**
 * Update a user's username and/or avatarEmoji, returning the safe row.
 */
export async function updateUserProfile(id, patch) {
  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, Number(id)))
    .returning(SAFE_USER_COLS);
  return updated || null;
}

/**
 * Update a user's total score.
 */
export async function updateUserScore(id, score) {
  await db.update(users).set({ score }).where(eq(users.id, Number(id)));
}

/**
 * Top-N non-admin users ordered by score (desc).
 */
export async function listLeaderboardUsers(limit = 50) {
  return db
    .select({
      id:          users.id,
      username:    users.username,
      avatarEmoji: users.avatarEmoji,
      score:       users.score,
      createdAt:   users.createdAt,
    })
    .from(users)
    .where(eq(users.isAdmin, false))
    .orderBy(desc(users.score))
    .limit(limit);
}

/**
 * List non-admin users for the admin console with sort/search/limit options.
 */
export async function listAdminUsers({ limit, sortBy, order, search }) {
  const sortColumn = sortBy === 'username' ? users.username : users.score;
  const orderFn = order === 'asc' ? asc : desc;

  const filters = [eq(users.isAdmin, false)];
  if (search) {
    filters.push(ilike(users.username, `%${search.toLowerCase()}%`));
  }

  return db
    .select(SAFE_USER_COLS)
    .from(users)
    .where(and(...filters))
    .orderBy(orderFn(sortColumn))
    .limit(limit);
}

/**
 * Find a non-admin user by id (used by admin user-detail page).
 */
export async function findNonAdminUserById(id) {
  const [user] = await db
    .select(SAFE_USER_COLS)
    .from(users)
    .where(and(eq(users.id, Number(id)), eq(users.isAdmin, false)))
    .limit(1);
  return user || null;
}

/**
 * List all non-admin users with the columns needed for the analytics dashboard.
 */
export async function listUsersForAnalytics() {
  return db
    .select({ id: users.id, score: users.score, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.isAdmin, false));
}
