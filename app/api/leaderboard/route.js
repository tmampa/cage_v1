import { NextResponse } from 'next/server';
import { parseQuery } from '../../../lib/validation/parse.js';
import { LeaderboardQuerySchema } from '../../../lib/validation/schemas.js';
import { listLeaderboardUsers } from '../../../db/queries/userRepo.js';

export async function GET(request) {
  try {
    const parsed = parseQuery(request.url, LeaderboardQuerySchema);
    if (!parsed.ok) return parsed.response;
    // `filter` is reserved for future time-window queries (week/month).
    // Currently the leaderboard is always all-time.

    const data = await listLeaderboardUsers(50);
    return NextResponse.json({ leaderboard: data });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
