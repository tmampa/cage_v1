import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { verifyAdmin } from '../../../../lib/verifyAdmin';

export async function GET(request) {
  try {
    await verifyAdmin(request);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return list of users who have chat history (metadata only)
      const usersSnap = await adminDb.collection('chat_history').get();
      const chatUsers = [];

      for (const userDoc of usersSnap.docs) {
        const sessionsSnap = await adminDb
          .collection('chat_history')
          .doc(userDoc.id)
          .collection('sessions')
          .get();

        let totalMessages = 0;
        let latestTimestamp = null;

        for (const sessionDoc of sessionsSnap.docs) {
          const msgSnap = await adminDb
            .collection('chat_history')
            .doc(userDoc.id)
            .collection('sessions')
            .doc(sessionDoc.id)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          const count = (
            await adminDb
              .collection('chat_history')
              .doc(userDoc.id)
              .collection('sessions')
              .doc(sessionDoc.id)
              .collection('messages')
              .count()
              .get()
          ).data().count;

          totalMessages += count;

          if (!msgSnap.empty) {
            const ts = msgSnap.docs[0].data().timestamp;
            if (!latestTimestamp || (ts && ts > latestTimestamp)) {
              latestTimestamp = ts;
            }
          }
        }

        // Fetch username from users collection
        const userProfileSnap = await adminDb.collection('users').doc(userDoc.id).get();
        const username = userProfileSnap.exists
          ? userProfileSnap.data().username
          : userDoc.id;

        chatUsers.push({
          userId: userDoc.id,
          username,
          sessionCount: sessionsSnap.size,
          totalMessages,
          lastMessageAt: latestTimestamp,
        });
      }

      return NextResponse.json({ chatUsers });
    }

    // Return full chat for a specific user
    const sessionsSnap = await adminDb
      .collection('chat_history')
      .doc(userId)
      .collection('sessions')
      .get();

    const sessions = [];
    for (const sessionDoc of sessionsSnap.docs) {
      const messagesSnap = await adminDb
        .collection('chat_history')
        .doc(userId)
        .collection('sessions')
        .doc(sessionDoc.id)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      sessions.push({
        sessionId: sessionDoc.id,
        messages: messagesSnap.docs.map((m) => ({ id: m.id, ...m.data() })),
      });
    }

    return NextResponse.json({ userId, sessions });
  } catch (error) {
    const status = error.message.includes('Forbidden')
      ? 403
      : error.message.includes('Missing')
      ? 401
      : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
