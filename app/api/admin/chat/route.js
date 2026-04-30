import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { getChatSessionsForUser, getChatUsersWithHistory } from '../../../../lib/chatHistory.js';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const chatUsers = await getChatUsersWithHistory();
      return NextResponse.json({ chatUsers });
    }

    const sessions = await getChatSessionsForUser(userId);
    return NextResponse.json({ userId, sessions });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
