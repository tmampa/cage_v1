/**
 * Wrapper for fetching admin APIs.
 * With the new JWT cookie system, fetch automatically includes the cookie.
 */
export async function adminFetch(url, options = {}) {
  const res = await fetch(url, options);
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}
