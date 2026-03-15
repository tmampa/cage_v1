import { NextResponse } from 'next/server';
import { adminDb } from '../../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../../lib/verifyAdmin';

export async function GET(request, { params }) {
  try {
    await verifyAdmin(request);

    const { userId } = await params;

    // User profile
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = { id: userSnap.id, ...userSnap.data() };

    // Level progress – game writes to 'progress' collection with userId/levelId/passed/score
    const progressSnap = await adminDb
      .collection('progress')
      .where('userId', '==', userId)
      .get();
    const levelProgress = progressSnap.docs.map((d) => d.data());

    // Unlocked levels – derived from highestLevel field on user doc
    const highestLevel = user.highestLevel || 1;
    const unlockedLevels = Array.from({ length: Math.min(highestLevel, 6) }, (_, i) => i + 1);

    // Feedback submitted by user
    const feedbackSnap = await adminDb
      .collection('feedback')
      .where('userId', '==', userId)
      .get();
    const feedback = feedbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Chat sessions metadata
    const sessionsSnap = await adminDb
      .collection('chat_history')
      .doc(userId)
      .collection('sessions')
      .get();

    const chatSessions = [];
    for (const sessionDoc of sessionsSnap.docs) {
      const messagesSnap = await adminDb
        .collection('chat_history')
        .doc(userId)
        .collection('sessions')
        .doc(sessionDoc.id)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      chatSessions.push({
        sessionId: sessionDoc.id,
        messageCount: messagesSnap.size,
        messages: messagesSnap.docs.map((m) => ({ id: m.id, ...m.data() })),
      });
    }

    return NextResponse.json({
      user,
      levelProgress,
      unlockedLevels,
      feedback,
      chatSessions,
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
