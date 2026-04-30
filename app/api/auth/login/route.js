import { NextResponse } from 'next/server';
import { verifyPassword, createJWT, buildSessionCookie } from '../../../../lib/auth.js';
import { parseBody } from '../../../../lib/validation/parse.js';
import { AuthLoginSchema } from '../../../../lib/validation/schemas.js';
import { findUserByUsername } from '../../../../db/queries/userRepo.js';

export async function POST(request) {
  try {
    const parsed = await parseBody(request, AuthLoginSchema);
    if (!parsed.ok) return parsed.response;
    const { username, password } = parsed.data;

    const user = await findUserByUsername(username.toLowerCase());

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
