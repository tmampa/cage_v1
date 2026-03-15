import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../lib/verifyAdmin';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const limitNum = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const filterType = searchParams.get('type') || 'all';
    const filterStatus = searchParams.get('status') || 'all';

    let q = adminDb.collection('feedback').orderBy('createdAt', 'desc');

    if (filterType !== 'all') {
      q = q.where('feedbackType', '==', filterType);
    }

    const snapshot = await q.limit(limitNum).get();

    let feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side status filter (resolved boolean)
    if (filterStatus === 'resolved') {
      feedback = feedback.filter((f) => f.resolved === true);
    } else if (filterStatus === 'unresolved') {
      feedback = feedback.filter((f) => !f.resolved);
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

// PATCH – toggle resolved status
export async function PATCH(request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const { feedbackId, resolved } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: 'feedbackId required' }, { status: 400 });
    }

    await adminDb.collection('feedback').doc(feedbackId).update({ resolved: !!resolved });

    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : error.message.includes('Missing') ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
