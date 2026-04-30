import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-in-production-32chars!');
const COOKIE_NAME = 'cage_session';
const EXPIRES_IN = '7d';

// ─── Password helpers ────────────────────────────────────────────────────────

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

/**
 * Create a signed JWT for a user.
 * @param {{ id: number, username: string, isAdmin: boolean }} user
 * @returns {Promise<string>} signed JWT string
 */
export async function createJWT(user) {
  return new SignJWT({ sub: String(user.id), username: user.username, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

/**
 * Verify a JWT string and return its payload, or null if invalid/expired.
 * @param {string} token
 * @returns {Promise<{ sub: string, username: string, isAdmin: boolean } | null>}
 */
export async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export { COOKIE_NAME };

/**
 * Build a Set-Cookie header value for the session token.
 * @param {string} token
 * @returns {string}
 */
export function buildSessionCookie(token) {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

/**
 * Build a Set-Cookie header value that clears the session.
 * @returns {string}
 */
export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

// ─── Admin helpers ─────────────────────────────────────────────────────────

/**
 * Return the list of admin usernames from the ADMIN_USERNAMES env var.
 * @returns {string[]}
 */
export function getAdminUsernames() {
  const raw = process.env.ADMIN_USERNAMES || '';
  return raw.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
}

/**
 * Check if a username belongs to an admin.
 * @param {string} username
 * @returns {boolean}
 */
export function isAdminUsername(username) {
  if (!username) return false;
  return getAdminUsernames().includes(username.toLowerCase());
}
