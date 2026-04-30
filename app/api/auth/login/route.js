import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db.js';
import { users } from '../../../../db/schema.js';
import { verifyPassword, createJWT, buildSessionCookie } from '../../../../lib/auth.js';
import { eq } from 'drizzle-orm';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    // Lookup user by username (case-insensitive)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }

    const token = await createJWT({
      id:       user.id,
      username: user.username,
      isAdmin:  user.isAdmin,
    });
    const cookie = buildSessionCookie(token);

    const safeUser = {
      id:          user.id,
      username:    user.username,
      avatarEmoji: user.avatarEmoji,
      score:       user.score,
      isAdmin:     user.isAdmin,
    };

    const res = NextResponse.json({ user: safeUser });
    res.headers.set('Set-Cookie', cookie);
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
