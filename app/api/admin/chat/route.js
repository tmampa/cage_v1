import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { getChatSessionsForUser, getChatUsersWithHistory } from '../../../../db/queries/chatRepo.js';
import { parseQuery } from '../../../../lib/validation/parse.js';
import { AdminChatQuerySchema } from '../../../../lib/validation/schemas.js';
import { errorResponse } from '../../../../lib/api/errors.js';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const parsed = parseQuery(request.url, AdminChatQuerySchema);
    if (!parsed.ok) return parsed.response;
    const { userId } = parsed.data;

    if (userId === undefined) {
      const chatUsers = await getChatUsersWithHistory();
      return NextResponse.json({ chatUsers });
    }

    const sessions = await getChatSessionsForUser(userId);
    return NextResponse.json({ userId, sessions });
  } catch (error) {
    return errorResponse(error, 'admin/chat');
  }
}
