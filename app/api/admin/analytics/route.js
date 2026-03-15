import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../lib/verifyAdmin';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    // ---- Users stats ----
    const usersSnap = await adminDb.collection('users').get();
    const totalUsers = usersSnap.size;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let newUsersThisWeek = 0;
    const users = usersSnap.docs.map((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate?.() || data.created_at?.toDate?.() || new Date(data.createdAt || data.created_at || 0);
      if (created >= weekAgo) newUsersThisWeek++;
      return { id: d.id, ...data };
    });

    // ---- Level progress stats ----
    // Game writes to 'progress' collection with fields: userId, levelId, passed, score
    const progressSnap = await adminDb.collection('progress').get();
    const allProgress = progressSnap.docs.map((d) => d.data());

    // Per-level aggregation
    const levelStats = {};
    allProgress.forEach((p) => {
      const lid = p.levelId || p.level_id;
      if (!lid) return;
      if (!levelStats[lid]) {
        levelStats[lid] = { levelId: lid, attempts: 0, completions: 0, totalScore: 0 };
      }
      levelStats[lid].attempts++;
      if (p.passed || p.completed) levelStats[lid].completions++;
      levelStats[lid].totalScore += p.score || 0;
    });

    Object.values(levelStats).forEach((ls) => {
      ls.passRate = ls.attempts > 0 ? Math.round((ls.completions / ls.attempts) * 100) : 0;
      ls.avgScore = ls.attempts > 0 ? Math.round(ls.totalScore / ls.attempts) : 0;
    });

    // User score distribution (buckets)
    const scoreBuckets = { '0': 0, '1-50': 0, '51-100': 0, '101-200': 0, '201-500': 0, '500+': 0 };
    users.forEach((u) => {
      const s = u.score || 0;
      if (s === 0) scoreBuckets['0']++;
      else if (s <= 50) scoreBuckets['1-50']++;
      else if (s <= 100) scoreBuckets['51-100']++;
      else if (s <= 200) scoreBuckets['101-200']++;
      else if (s <= 500) scoreBuckets['201-500']++;
      else scoreBuckets['500+']++;
    });

    // Users who completed at least one level
    const usersWithCompletion = new Set(
      allProgress.filter((p) => p.passed || p.completed).map((p) => p.userId || p.user_id)
    );
    const overallPassRate =
      totalUsers > 0 ? Math.round((usersWithCompletion.size / totalUsers) * 100) : 0;

    // Average score
    const totalScore = users.reduce((sum, u) => sum + (u.score || 0), 0);
    const avgScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;

    // ---- Feedback stats ----
    const feedbackSnap = await adminDb.collection('feedback').get();
    const allFeedback = feedbackSnap.docs.map((d) => d.data());
    const feedbackCount = allFeedback.length;

    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const typeDist = { general: 0, bug: 0, feature: 0 };
    allFeedback.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) ratingDist[f.rating]++;
      if (typeDist[f.feedbackType] !== undefined) typeDist[f.feedbackType]++;
    });

    return NextResponse.json({
      users: { totalUsers, newUsersThisWeek, avgScore, overallPassRate, scoreBuckets },
      levels: Object.values(levelStats).sort((a, b) => a.levelId - b.levelId),
      feedback: { feedbackCount, ratingDist, typeDist },
    });
  } catch (error) {
    const status = error.message.includes('Forbidden')
      ? 403
      : error.message.includes('Missing')
      ? 401
      : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
