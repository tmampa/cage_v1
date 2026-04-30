/**
 * Wrapper for fetching admin APIs.
 * With the new JWT cookie system, fetch automatically includes the cookie.
 *
 * Handles both legacy `{ error: 'msg' }` and the unified envelope
 * `{ error: { code, message, details? } }` produced by `errorResponse`.
 */
export async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (typeof data.error === 'string' && data.error) ||
      data.error?.message ||
      `Error ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return res.json();
}
