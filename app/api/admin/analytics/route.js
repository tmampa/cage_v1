import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { errorResponse } from '../../../../lib/api/errors.js';
import { listUsersForAnalytics } from '../../../../db/queries/userRepo.js';
import { getProgressForUsers } from '../../../../db/queries/progressRepo.js';
import { getAllFeedback } from '../../../../db/queries/feedbackRepo.js';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const allUsers = await listUsersForAnalytics();

    const totalUsers = allUsers.length;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = allUsers.filter(u => new Date(u.createdAt) >= weekAgo).length;
    const totalScore = allUsers.reduce((sum, u) => sum + (u.score || 0), 0);
    const avgScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0;

    // Score distribution
    const scoreBuckets = { '0': 0, '1-50': 0, '51-100': 0, '101-200': 0, '201-500': 0, '500+': 0 };
    allUsers.forEach(u => {
      const s = u.score || 0;
      if (s === 0) scoreBuckets['0']++;
      else if (s <= 50) scoreBuckets['1-50']++;
      else if (s <= 100) scoreBuckets['51-100']++;
      else if (s <= 200) scoreBuckets['101-200']++;
      else if (s <= 500) scoreBuckets['201-500']++;
      else scoreBuckets['500+']++;
    });

    const playerIds = allUsers.map(u => u.id);
    const allProgress = await getProgressForUsers(playerIds);

    const levelStats = {};
    allProgress.forEach(p => {
      const lid = p.levelId;
      if (!lid) return;
      if (!levelStats[lid]) levelStats[lid] = { levelId: lid, attempts: 0, completions: 0, totalScore: 0 };
      levelStats[lid].attempts++;
      if (p.completed) levelStats[lid].completions++;
      levelStats[lid].totalScore += p.score || 0;
    });

    Object.values(levelStats).forEach(ls => {
      ls.passRate = ls.attempts > 0 ? Math.round((ls.completions / ls.attempts) * 100) : 0;
      ls.avgScore = ls.attempts > 0 ? Math.round(ls.totalScore / ls.attempts) : 0;
    });

    const usersWithCompletion = new Set(allProgress.filter(p => p.completed).map(p => p.userId));
    const overallPassRate = totalUsers > 0 ? Math.round((usersWithCompletion.size / totalUsers) * 100) : 0;

    const allFeedback = await getAllFeedback();
    const feedbackCount = allFeedback.length;
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const typeDist = { general: 0, bug: 0, feature: 0 };
    allFeedback.forEach(f => {
      if (f.rating >= 1 && f.rating <= 5) ratingDist[f.rating]++;
      if (typeDist[f.feedbackType] !== undefined) typeDist[f.feedbackType]++;
    });

    return NextResponse.json({
      users: { totalUsers, newUsersThisWeek, avgScore, overallPassRate, scoreBuckets },
      levels: Object.values(levelStats).sort((a, b) => a.levelId - b.levelId),
      feedback: { feedbackCount, ratingDist, typeDist },
    });
  } catch (error) {
    return errorResponse(error, 'admin/analytics');
  }
}
