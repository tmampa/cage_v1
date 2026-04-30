import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../../lib/db.js';
import { feedback } from '../../../../db/schema.js';
import { verifyJWT, COOKIE_NAME } from '../../../../lib/auth.js';

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

    const { feedbackType = 'general', rating = 0, message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    await db.insert(feedback).values({
      userId,
      username,
      feedbackType,
      rating: Number(rating),
      message: message.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 });
  }
}
