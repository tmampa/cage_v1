import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db.js';
import { users, levelProgress } from '../../../../db/schema.js';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { eq, desc, asc, ilike, sql } from 'drizzle-orm';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const limitNum = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const sortBy = searchParams.get('sortBy') || 'score';
    const order = searchParams.get('order') || 'desc';
    const search = (searchParams.get('search') || '').toLowerCase();

    // Build order-by clause
    const sortColumn = sortBy === 'username' ? users.username : users.score;
    const orderFn = order === 'asc' ? asc : desc;

    let rows = await db
      .select({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        isAdmin:     users.isAdmin,
        createdAt:   users.createdAt,
      })
      .from(users)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum);

    // Client-side search filter
    if (search) {
      rows = rows.filter(u => u.username.toLowerCase().includes(search));
    }

    // Enrich with level progress counts
    const progressRows = await db.select().from(levelProgress);
    const enriched = rows.map(u => {
      const prog = progressRows.filter(p => p.userId === u.id);
      const completed = prog.filter(p => p.completed).length;
      const lastPlayed = prog.reduce((latest, p) => {
        const t = p.lastPlayedAt ? new Date(p.lastPlayedAt) : null;
        return t && (!latest || t > latest) ? t : latest;
      }, null);
      return {
        ...u,
        levelsCompleted: completed,
        lastPlayed: lastPlayed ? lastPlayed.toISOString() : null,
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
