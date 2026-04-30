import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, COOKIE_NAME } from '../../../lib/auth.js';
import { parseBody } from '../../../lib/validation/parse.js';
import { FeedbackPostSchema } from '../../../lib/validation/schemas.js';
import { createFeedback } from '../../../db/queries/feedbackRepo.js';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    let userId = null;
    let username = 'Anonymous';

    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        userId = Number(payload.sub);
        username = payload.username;
      }
    }

    const parsed = await parseBody(request, FeedbackPostSchema);
    if (!parsed.ok) return parsed.response;
    const { feedbackType, rating, message } = parsed.data;

    await createFeedback({ userId, username, feedbackType, rating, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 });
  }
}
