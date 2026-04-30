import { NextResponse } from 'next/server';
import { db } from '../../../lib/db.js';
import { users } from '../../../db/schema.js';
import { desc, gte } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('filter') || 'all';

    let query = db
      .select({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        createdAt:   users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.score))
      .limit(50);

    // For time filters, we'd need an updatedAt column — for now return all-time
    // Future: add updated_at column and filter by it
    const data = await query;

    return NextResponse.json({ leaderboard: data });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
