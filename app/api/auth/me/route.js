import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT, COOKIE_NAME } from '../../../../lib/auth.js';
import { parseBody } from '../../../../lib/validation/parse.js';
import { AuthMePatchSchema } from '../../../../lib/validation/schemas.js';
import { findSafeUserById, updateUserProfile } from '../../../../db/queries/userRepo.js';

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

    const user = await findSafeUserById(payload.sub);
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

    const parsed = await parseBody(request, AuthMePatchSchema);
    if (!parsed.ok) return parsed.response;
    const { username, avatarEmoji } = parsed.data;

    const updateData = {};
    if (username) updateData.username = username.toLowerCase();
    if (avatarEmoji) updateData.avatarEmoji = avatarEmoji;

    const updated = await updateUserProfile(payload.sub, updateData);
    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
    }
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
