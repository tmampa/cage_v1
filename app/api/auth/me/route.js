import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../../lib/db.js';
import { users } from '../../../../db/schema.js';
import { verifyJWT, COOKIE_NAME } from '../../../../lib/auth.js';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const [user] = await db
      .select({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        isAdmin:     users.isAdmin,
        createdAt:   users.createdAt,
      })
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ user: null });
  }
}

// PATCH — update username or avatar
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username, avatarEmoji } = await request.json();
    const updateData = {};

    if (username) {
      const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
      if (!USERNAME_RE.test(username)) {
        return NextResponse.json({ error: 'Invalid username format.' }, { status: 400 });
      }
      updateData.username = username.toLowerCase();
    }

    if (avatarEmoji) {
      updateData.avatarEmoji = avatarEmoji;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, Number(payload.sub)))
      .returning({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        isAdmin:     users.isAdmin,
      });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
