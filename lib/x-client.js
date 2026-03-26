/**
 * X API v2 HTTP Client (server-side only)
 *
 * Handles all authenticated communication with the X API.
 * Uses the native fetch API (Node 18+) with proper User-Agent headers.
 *
 * TOKEN RESOLUTION ORDER:
 * 1. Explicit `bearerToken` parameter (passed from API route via request header)
 * 2. X_BEARER_TOKEN environment variable (fallback for Vercel env config)
 * 3. Error — no token available
 *
 * WHY TWO SOURCES?
 * The browser stores the token in localStorage and sends it via an
 * "X-Bearer-Token" request header. API routes extract it and pass it here.
 * The env var fallback means both approaches (browser-only and env var) work.
 */

const BASE_URL = "https://api.x.com/2";
const USER_AGENT = "x-filtered-stream/2.0.0";

/**
 * Resolve the Bearer Token from explicit param or environment.
 */
function resolveBearerToken(explicitToken) {
  if (explicitToken) return explicitToken;

  const envToken = process.env.X_BEARER_TOKEN;
  if (envToken && envToken !== "your_bearer_token_here") return envToken;

  const error = new Error(
    "No Bearer Token provided. Add your token on the Setup page, or set X_BEARER_TOKEN as an environment variable."
  );
  error.code = "AUTH_NOT_CONFIGURED";
  throw error;
}

/**
 * Extract the Bearer Token from an incoming Next.js Request object.
 * Looks for the "X-Bearer-Token" header (sent by the frontend AuthProvider).
 *
 * Usage in API routes:
 *   import { getTokenFromRequest } from "@/lib/x-client";
 *   const token = getTokenFromRequest(request);
 */
export function getTokenFromRequest(request) {
  // Custom header from AuthProvider
  const headerToken = request.headers.get("x-bearer-token");
  if (headerToken) return headerToken;

  // Fallback to env
  const envToken = process.env.X_BEARER_TOKEN;
  if (envToken && envToken !== "your_bearer_token_here") return envToken;

  return null;
}

/**
 * Make an authenticated request to the X API.
 *
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g. "/tweets/search/stream/rules")
 * @param {Object} options
 * @param {Object} [options.body] - Request body (will be JSON-serialized)
 * @param {Object} [options.params] - URL query parameters
 * @param {string} [options.bearerToken] - Bearer Token (from request header or explicit)
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiRequest(method, path, { body, params, bearerToken } = {}) {
  const token = resolveBearerToken(bearerToken);
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(
      `X API returned ${response.status}: ${tryParseErrorMessage(errorBody, response.status)}`
    );
    error.status = response.status;
    error.body = errorBody;
    error.code = mapStatusToCode(response.status);
    throw error;
  }

  return response.json();
}

/**
 * Open a streaming connection to the X API.
 * Returns the raw Response so the caller can consume the body as a stream.
 *
 * WHY: Streaming connections are long-lived HTTP responses.
 * We return the raw response instead of parsing it, because the body
 * is an infinite stream that must be read incrementally.
 */
export async function apiStream(path, { params, bearerToken } = {}) {
  const token = resolveBearerToken(bearerToken);
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(
      `X API stream error ${response.status}: ${tryParseErrorMessage(errorBody, response.status)}`
    );
    error.status = response.status;
    error.body = errorBody;
    error.code = mapStatusToCode(response.status);
    throw error;
  }

  return response;
}

// ---------------------------------------------------------------------------
// Error helpers — provide user-friendly messages for common API errors
// ---------------------------------------------------------------------------

function tryParseErrorMessage(body, status) {
  try {
    const parsed = JSON.parse(body);
    if (parsed.detail) return parsed.detail;
    if (parsed.errors?.[0]?.message) return parsed.errors[0].message;
    if (parsed.title) return parsed.title;
    return body.substring(0, 200);
  } catch {
    return friendlyStatusMessage(status);
  }
}

function friendlyStatusMessage(status) {
  const messages = {
    400: "Bad request — check your parameters",
    401: "Unauthorized — your Bearer Token is invalid or expired",
    403: "Forbidden — you don't have access to this resource. Check your API access level.",
    404: "Not found — the endpoint doesn't exist",
    429: "Rate limited — too many requests. Wait and try again.",
    500: "X API server error — try again later",
    502: "X API is temporarily unavailable — try again later",
    503: "X API service unavailable — try again later",
  };
  return messages[status] || `Unexpected error (HTTP ${status})`;
}

function mapStatusToCode(status) {
  if (status === 401) return "AUTH_INVALID";
  if (status === 403) return "ACCESS_DENIED";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "API_ERROR";
}
