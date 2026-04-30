import { cookies } from 'next/headers';
import { verifyJWT, COOKIE_NAME } from './auth.js';
import { ApiError } from './api/errors.js';

/**
 * Verifies that the incoming request has a valid admin JWT session.
 * Throws an `ApiError` (caught by the route's `errorResponse` helper) if not.
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

  if (!token) throw ApiError.unauthorized('Missing session token');

  const payload = await verifyJWT(token);
  if (!payload) throw ApiError.unauthorized('Invalid or expired session');

  if (!payload.isAdmin) throw ApiError.forbidden('Admin access required');

  return payload;
}
