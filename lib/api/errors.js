import { NextResponse } from 'next/server';

/**
 * Typed API error. Routes throw these and the unified `errorResponse` helper
 * maps them to a consistent JSON shape with the right HTTP status.
 *
 * Replaces ad-hoc `error.message.includes('Forbidden'|'Missing')` patterns
 * scattered through admin routes.
 */
export class ApiError extends Error {
  /**
   * @param {number} status   HTTP status code
   * @param {string} code     Machine-readable code, e.g. 'BAD_REQUEST'
   * @param {string} message  Human-readable message
   * @param {unknown} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Invalid input', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message);
  }

  static rateLimited(message = 'Too many requests', details) {
    return new ApiError(429, 'RATE_LIMITED', message, details);
  }

  static serviceUnavailable(message = 'Service unavailable') {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }

  static internal(message = 'Internal error') {
    return new ApiError(500, 'INTERNAL', message);
  }
}

/**
 * Build a JSON error response. Recognises:
 *   - ApiError       -> use its status/code/message/details
 *   - ZodError       -> 400 with field-level issues
 *   - PG unique 23505 -> 409 conflict
 *   - everything else -> 500 with a generic message (logged server-side)
 *
 * @param {unknown} err
 * @param {string}  [logTag] optional tag for server logs
 */
export function errorResponse(err, logTag = 'api') {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      },
      { status: err.status }
    );
  }

  if (err && err.name === 'ZodError') {
    return errorResponse(
      ApiError.badRequest('Invalid input', err.issues),
      logTag
    );
  }

  if (err && err.code === '23505') {
    return errorResponse(ApiError.conflict('Already exists'), logTag);
  }

  console.error(`[${logTag}]`, err);
  return errorResponse(ApiError.internal(), logTag);
}

/**
 * Build a successful JSON response wrapped in a `{ data }` envelope.
 *
 * Existing routes that return bespoke shapes (e.g. `{ user }`, `{ progress }`)
 * are intentionally NOT converted in bulk; per the migration plan we adopt
 * `ok()` only on a per-route + callers basis.
 *
 * @template T
 * @param {T} data
 * @param {ResponseInit} [init]
 */
export function ok(data, init) {
  return NextResponse.json({ data }, init);
}
