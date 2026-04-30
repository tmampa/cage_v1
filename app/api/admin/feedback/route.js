import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db.js';
import { feedback, users } from '../../../../db/schema.js';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { eq, desc } from 'drizzle-orm';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const limitNum = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const filterType = searchParams.get('type') || 'all';
    const filterStatus = searchParams.get('status') || 'all';

    let rows = await db
      .select({
        id:           feedback.id,
        userId:       feedback.userId,
        username:     feedback.username,
        feedbackType: feedback.feedbackType,
        rating:       feedback.rating,
        message:      feedback.message,
        resolved:     feedback.resolved,
        createdAt:    feedback.createdAt,
        userScore:    users.score,
      })
      .from(feedback)
      .leftJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt))
      .limit(limitNum);

    if (filterType !== 'all') {
      rows = rows.filter(f => f.feedbackType === filterType);
    }

    if (filterStatus === 'resolved') {
      rows = rows.filter(f => f.resolved === true);
    } else if (filterStatus === 'unresolved') {
      rows = rows.filter(f => !f.resolved);
    }

    return NextResponse.json({ feedback: rows });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(request) {
  try {
    await verifyAdmin(request);
    const { feedbackId, resolved } = await request.json();

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId required' }, { status: 400 });
    }

    await db
      .update(feedback)
      .set({ resolved: !!resolved })
      .where(eq(feedback.id, Number(feedbackId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
