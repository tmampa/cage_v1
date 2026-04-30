import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, COOKIE_NAME } from '../../../lib/auth.js';
import { parseBody } from '../../../lib/validation/parse.js';
import { ProgressPostSchema } from '../../../lib/validation/schemas.js';
import {
  getProgressByUserId,
  upsertProgressWithBestScore,
  sumCompletedScore,
} from '../../../db/queries/progressRepo.js';
import { updateUserScore } from '../../../db/queries/userRepo.js';

// GET — fetch current user's level progress
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ progress: [] });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ progress: [] });
    if (payload.isAdmin) return NextResponse.json({ progress: [] });

    const userId = Number(payload.sub);

    const progress = await getProgressByUserId(userId);
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ progress: [] });
  }
}

// POST — save level progress, recalculate total score, unlock next level
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (payload.isAdmin) {
      return NextResponse.json({ success: true, totalScore: 0, skipped: true });
    }

    const userId = Number(payload.sub);

    const parsed = await parseBody(request, ProgressPostSchema);
    if (!parsed.ok) return parsed.response;
    const { levelId, score, completed } = parsed.data;

    await upsertProgressWithBestScore({ userId, levelId, score, completed });

    const totalScore = await sumCompletedScore(userId);
    await updateUserScore(userId, totalScore);

    return NextResponse.json({ success: true, totalScore });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 });
  }
}
