import { NextResponse } from 'next/server';
import { hashPassword, createJWT, buildSessionCookie, isAdminUsername } from '../../../../lib/auth.js';
import { parseBody } from '../../../../lib/validation/parse.js';
import { AuthRegisterSchema } from '../../../../lib/validation/schemas.js';
import { findUserByUsername, createUser } from '../../../../db/queries/userRepo.js';

export async function POST(request) {
  try {
    const parsed = await parseBody(request, AuthRegisterSchema);
    if (!parsed.ok) return parsed.response;
    const { username, password } = parsed.data;

    const usernameLower = username.toLowerCase();
    const existing = await findUserByUsername(usernameLower);
    if (existing) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const isAdmin = isAdminUsername(username);
    const newUser = await createUser({ usernameLower, passwordHash, isAdmin });

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
