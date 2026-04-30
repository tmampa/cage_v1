/**
 * Admin auth utilities
 * Admins are identified by username from the ADMIN_USERNAMES env var.
 */

/**
 * Get the list of admin usernames from environment variables.
 * @returns {string[]} Array of admin usernames (lowercase)
 */
export function getAdminUsernames() {
  const raw = process.env.ADMIN_USERNAMES || '';
  return raw.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
}

/**
 * Check if a given username belongs to an admin.
 * @param {string} username
 * @returns {boolean}
 */
export function isAdminUsername(username) {
  if (!username) return false;
  return getAdminUsernames().includes(username.toLowerCase());
}

// Legacy compatibility alias
export const getAdminEmails = getAdminUsernames;
export const isAdminEmail = isAdminUsername;
