import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../lib/verifyAdmin';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const limitNum = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const sortBy = searchParams.get('sortBy') || 'score';
    const order = searchParams.get('order') || 'desc';
    const search = (searchParams.get('search') || '').toLowerCase();

    // Fetch users
    let q = adminDb.collection('users').orderBy(sortBy, order).limit(limitNum);
    const snapshot = await q.get();

    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side search filter (Firestore doesn't support LIKE queries)
    if (search) {
      users = users.filter(
        (u) =>
          (u.username || '').toLowerCase().includes(search) ||
          (u.email || '').toLowerCase().includes(search)
      );
    }

    // Fetch progress for each user to get completion counts
    // The game writes to the 'progress' collection with fields: userId, levelId, passed, score
    const progressSnapshot = await adminDb.collection('progress').get();
    const progressByUser = {};
    progressSnapshot.docs.forEach((doc) => {
      const d = doc.data();
      const uid = d.userId || d.user_id;
      if (!progressByUser[uid]) progressByUser[uid] = [];
      progressByUser[uid].push(d);
    });

    const enriched = users.map((u) => {
      const prog = progressByUser[u.id] || [];
      const completed = prog.filter((p) => p.passed || p.completed).length;
      const lastPlayed = prog.reduce((latest, p) => {
        const raw = p.completedAt || p.updatedAt || p.last_played_at;
        const t = raw?.toDate?.() || (typeof raw === 'string' ? new Date(raw) : raw);
        return t && (!latest || t > latest) ? t : latest;
      }, null);
      return {
        ...u,
        levelsCompleted: completed,
        lastPlayed: lastPlayed ? new Date(lastPlayed).toISOString() : null,
      };
    });

    return NextResponse.json({ users: enriched });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
