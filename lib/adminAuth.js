/**
 * Admin authentication utilities
 * Uses hardcoded admin emails from environment variables
 */

const ADMIN_EMAILS_KEY = 'NEXT_PUBLIC_ADMIN_EMAILS';

/**
 * Get the list of admin emails from environment variables
 * @returns {string[]} Array of admin email addresses (lowercase)
 */
export function getAdminEmails() {
  const raw = process.env[ADMIN_EMAILS_KEY] || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if a given email belongs to an admin
 * @param {string} email
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const admins = getAdminEmails();
  return admins.includes(email.toLowerCase());
}
