import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';

/**
 * Chat history is stored in sessionStorage only (client-side).
 * This endpoint is kept for API compatibility but returns empty data.
 * In a future iteration, a server-side chat_log table could be added.
 */
export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ chatUsers: [] });
    }

    return NextResponse.json({ userId, sessions: [] });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
