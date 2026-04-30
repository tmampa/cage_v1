import { cookies } from 'next/headers';
import { verifyJWT, COOKIE_NAME } from './auth.js';

/**
 * Verifies that the incoming request has a valid admin JWT session.
 * Throws an error (which the route handler should catch) if not.
 * @returns {Promise<{ sub: string, username: string, isAdmin: boolean }>} the JWT payload
 */
export async function verifyAdmin(request) {
  // Try cookie first, then Authorization header
  let token = null;

  const cookieStore = await cookies();
  token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    const auth = request.headers.get('authorization') || '';
    if (auth.startsWith('Bearer ')) token = auth.slice(7);
  }

  if (!token) throw new Error('Missing session token');

  const payload = await verifyJWT(token);
  if (!payload) throw new Error('Invalid or expired session');

  if (!payload.isAdmin) throw new Error('Forbidden — admin access required');

  return payload;
}
