/**
 * Simple in-memory rate limiter for API requests
 */

// Rate limiting store (in-memory)
const rateLimitStore = new Map();

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  message: 'Too many requests. Please wait a moment before sending another message.',
};

/**
 * Check if a request should be rate limited
 * @param {string} identifier - User identifier (IP address, session ID, etc.)
 * @param {object} config - Optional custom rate limit configuration
 * @returns {object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, config = RATE_LIMIT_CONFIG) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  // Filter out requests outside the time window
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < config.windowMs
  );
  
  const allowed = recentRequests.length < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - recentRequests.length);
  
  if (allowed) {
    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
  }
  
  // Calculate reset time (when the oldest request expires)
  const resetTime = recentRequests.length > 0
    ? recentRequests[0] + config.windowMs
    : now + config.windowMs;
  
  // Clean up old entries periodically to prevent memory leaks
  if (rateLimitStore.size > 1000) {
    cleanupRateLimitStore(now, config.windowMs);
  }
  
  return {
    allowed,
    remaining: allowed ? remaining - 1 : remaining,
    resetTime,
    retryAfter: allowed ? 0 : Math.ceil((resetTime - now) / 1000)
  };
}

/**
 * Clean up expired entries from rate limit store
 * @param {number} now - Current timestamp
 * @param {number} windowMs - Time window in milliseconds
 */
function cleanupRateLimitStore(now, windowMs) {
  const cutoff = now - windowMs;
  
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const validTimestamps = timestamps.filter(t => t > cutoff);
    
    if (validTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validTimestamps);
    }
  }
}

/**
 * Reset rate limit for a specific identifier
 * @param {string} identifier - User identifier
 */
export function resetRateLimit(identifier) {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status for an identifier
 * @param {string} identifier - User identifier
 * @param {object} config - Optional custom rate limit configuration
 * @returns {object} - { requests: number, remaining: number, resetTime: number }
 */
export function getRateLimitStatus(identifier, config = RATE_LIMIT_CONFIG) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];
  
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < config.windowMs
  );
  
  const remaining = Math.max(0, config.maxRequests - recentRequests.length);
  const resetTime = recentRequests.length > 0
    ? recentRequests[0] + config.windowMs
    : now + config.windowMs;
  
  return {
    requests: recentRequests.length,
    remaining,
    resetTime,
    retryAfter: recentRequests.length >= config.maxRequests
      ? Math.ceil((resetTime - now) / 1000)
      : 0
  };
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearAllRateLimits() {
  rateLimitStore.clear();
}
