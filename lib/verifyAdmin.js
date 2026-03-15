import { adminAuth } from './firebaseAdmin';
import { isAdminEmail } from './adminAuth';

/**
 * Verify the incoming request is from an authenticated admin.
 * Expects header:  Authorization: Bearer <firebase-id-token>
 *
 * Returns the decoded user on success; throws on failure.
 */
export async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new Error('Missing authorization token');
  }

  const decoded = await adminAuth.verifyIdToken(token);

  if (!isAdminEmail(decoded.email)) {
    throw new Error('Forbidden – not an admin');
  }

  return decoded;
}
