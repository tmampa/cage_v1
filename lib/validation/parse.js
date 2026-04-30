import { ApiError, errorResponse } from '../api/errors.js';

/**
 * Result helpers for validating request input with zod.
 *
 * Each helper returns either:
 *   { ok: true, data }                — validation passed
 *   { ok: false, response }           — return `response` immediately from the route
 */

/**
 * Build a 400 NextResponse describing zod validation failures.
 * Routed through the unified ApiError envelope so error shapes match the rest of the API.
 * @param {string} kind   Human label for the input source (body|query|params)
 * @param {import('zod').ZodError} zodError
 */
function buildBadRequest(kind, zodError) {
  return errorResponse(
    ApiError.badRequest(
      `Invalid ${kind}`,
      zodError.issues.map((i) => ({
        path: i.path,
        message: i.message,
        code: i.code,
      }))
    ),
    'validation'
  );
}

/**
 * Parse and validate a JSON request body.
 * @template T
 * @param {Request} request
 * @param {import('zod').ZodSchema<T>} schema
 * @returns {Promise<{ ok: true, data: T } | { ok: false, response: Response }>}
 */
export async function parseBody(request, schema) {
  let raw;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: errorResponse(ApiError.badRequest('Invalid JSON body'), 'validation'),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: buildBadRequest('body', result.error) };
  }
  return { ok: true, data: result.data };
}

/**
 * Parse and validate a request's URL query string.
 * @template T
 * @param {string|URL} url
 * @param {import('zod').ZodSchema<T>} schema
 * @returns {{ ok: true, data: T } | { ok: false, response: Response }}
 */
export function parseQuery(url, schema) {
  const params = Object.fromEntries(new URL(url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    return { ok: false, response: buildBadRequest('query', result.error) };
  }
  return { ok: true, data: result.data };
}

/**
 * Parse and validate a route's dynamic params.
 * @template T
 * @param {Record<string, unknown>} params
 * @param {import('zod').ZodSchema<T>} schema
 * @returns {{ ok: true, data: T } | { ok: false, response: Response }}
 */
export function parseParams(params, schema) {
  const result = schema.safeParse(params);
  if (!result.success) {
    return { ok: false, response: buildBadRequest('params', result.error) };
  }
  return { ok: true, data: result.data };
}
