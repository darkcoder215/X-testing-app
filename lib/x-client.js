/**
 * X API v2 HTTP Client (server-side only)
 *
 * Handles all authenticated communication with the X API.
 * Uses the native fetch API (Node 18+) with proper User-Agent headers.
 *
 * WHY: Centralizing API calls ensures consistent auth, error handling,
 * and header management across all endpoints.
 */

const BASE_URL = "https://api.x.com/2";
const USER_AGENT = "x-filtered-stream/2.0.0";

/**
 * Get the Bearer Token from environment.
 * Throws a descriptive error if not configured.
 */
function getBearerToken() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || token === "your_bearer_token_here") {
    const error = new Error(
      "X_BEARER_TOKEN is not configured. Go to the Setup page to add your Bearer Token."
    );
    error.code = "AUTH_NOT_CONFIGURED";
    throw error;
  }
  return token;
}

/**
 * Make an authenticated request to the X API.
 *
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g. "/tweets/search/stream/rules")
 * @param {Object} options
 * @param {Object} [options.body] - Request body (will be JSON-serialized)
 * @param {Object} [options.params] - URL query parameters
 * @param {string} [options.bearerToken] - Override the env Bearer Token
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiRequest(method, path, { body, params, bearerToken } = {}) {
  const token = bearerToken || getBearerToken();
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
  const token = bearerToken || getBearerToken();
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
    // X API v2 error format
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
