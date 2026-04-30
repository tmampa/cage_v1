import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../../lib/verifyAdmin.js';
import { parseBody, parseQuery } from '../../../../lib/validation/parse.js';
import { AdminFeedbackQuerySchema, AdminFeedbackPatchSchema } from '../../../../lib/validation/schemas.js';
import { errorResponse } from '../../../../lib/api/errors.js';
import { listFeedbackWithUser, markFeedbackResolved } from '../../../../db/queries/feedbackRepo.js';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const parsed = parseQuery(request.url, AdminFeedbackQuerySchema);
    if (!parsed.ok) return parsed.response;
    const { limit, type, status } = parsed.data;

    const rows = await listFeedbackWithUser({ limit, type, status });
    return NextResponse.json({ feedback: rows });
  } catch (error) {
    return errorResponse(error, 'admin/feedback');
  }
}

export async function PATCH(request) {
  try {
    await verifyAdmin(request);

    const parsed = await parseBody(request, AdminFeedbackPatchSchema);
    if (!parsed.ok) return parsed.response;
    const { feedbackId, resolved } = parsed.data;

    await markFeedbackResolved(feedbackId, resolved);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'admin/feedback:patch');
  }
}
