import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { parseQuery } from '../../../../lib/validation/parse.js';
import { AdminUsersQuerySchema } from '../../../../lib/validation/schemas.js';
import { errorResponse } from '../../../../lib/api/errors.js';
import { listAdminUsers } from '../../../../db/queries/userRepo.js';
import { getProgressForUsers } from '../../../../db/queries/progressRepo.js';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const parsed = parseQuery(request.url, AdminUsersQuerySchema);
    if (!parsed.ok) return parsed.response;

    const rows = await listAdminUsers(parsed.data);

    const userIds = rows.map((u) => u.id);
    const progressRows = await getProgressForUsers(userIds);

    const enriched = rows.map((u) => {
      const prog = progressRows.filter((p) => p.userId === u.id);
      const completed = prog.filter((p) => p.completed).length;
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
    return errorResponse(error, 'admin/users');
  }
}
