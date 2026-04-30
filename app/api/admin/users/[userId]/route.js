import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../../lib/verifyAdmin.js';
import { parseParams } from '../../../../../lib/validation/parse.js';
import { AdminUserIdParamSchema } from '../../../../../lib/validation/schemas.js';
import { MAX_LEVEL_ID } from '../../../../../constants/levels.js';
import { ApiError, errorResponse } from '../../../../../lib/api/errors.js';
import { findNonAdminUserById } from '../../../../../db/queries/userRepo.js';
import { getProgressByUserId } from '../../../../../db/queries/progressRepo.js';
import { getFeedbackByUserId } from '../../../../../db/queries/feedbackRepo.js';
import { getChatSessionsForUser } from '../../../../../db/queries/chatRepo.js';

export async function GET(request, { params }) {
  try {
    await verifyAdmin(request);

    const resolvedParams = await params;
    const parsed = parseParams(resolvedParams, AdminUserIdParamSchema);
    if (!parsed.ok) return parsed.response;
    const uid = parsed.data.userId;

    const user = await findNonAdminUserById(uid);
    if (!user) throw ApiError.notFound('User not found');

    const levelProgressRows = await getProgressByUserId(uid);

    const completedIds = levelProgressRows.filter((p) => p.completed).map((p) => p.levelId);
    const highestCompleted = completedIds.length > 0 ? Math.max(...completedIds) : 0;
    const unlockedLevels = Array.from(
      { length: Math.min(highestCompleted + 1, MAX_LEVEL_ID) },
      (_, i) => i + 1
    );

    const userFeedback = await getFeedbackByUserId(uid);
    const chatSessions = await getChatSessionsForUser(uid);

    return NextResponse.json({
      user,
      levelProgress: levelProgressRows,
      unlockedLevels,
      feedback: userFeedback,
      chatSessions,
    });
  } catch (error) {
    return errorResponse(error, 'admin/users/[userId]');
  }
}
