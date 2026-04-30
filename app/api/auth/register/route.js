import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db.js';
import { users } from '../../../../db/schema.js';
import { hashPassword, createJWT, buildSessionCookie, isAdminUsername } from '../../../../lib/auth.js';
import { eq } from 'drizzle-orm';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Validate username
    if (!username || !USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: 'Username must be 3–20 characters and only contain letters, numbers, or underscores.' },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Check if username is already taken (case-insensitive)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const isAdmin = isAdminUsername(username);

    const [newUser] = await db
      .insert(users)
      .values({
        username:     username.toLowerCase(),
        passwordHash,
        avatarEmoji:  '👤',
        score:        0,
        isAdmin,
      })
      .returning({
        id:          users.id,
        username:    users.username,
        avatarEmoji: users.avatarEmoji,
        score:       users.score,
        isAdmin:     users.isAdmin,
      });

    const token = await createJWT(newUser);
    const cookie = buildSessionCookie(token);

    const res = NextResponse.json({ user: newUser }, { status: 201 });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
