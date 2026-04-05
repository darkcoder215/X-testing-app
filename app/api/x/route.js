/**
 * /api/x — Generic X API v2 proxy
 *
 * POST /api/x
 * Body: { "endpointKey": "post-lookup", "params": { "id": "123", ... } }
 *
 * WHY A PROXY?
 * The browser can't call the X API directly (CORS + auth). This route:
 * 1. Receives the endpoint key and parameters from the browser
 * 2. Validates the endpoint exists in our registry
 * 3. Builds the actual X API URL
 * 4. Makes the authenticated request using the user's Bearer Token
 * 5. Returns the raw response so users can see exactly what the API returns
 *
 * LEARNING VALUE:
 * The response includes the full URL that was called, the HTTP status,
 * headers, and raw body — so users can see exactly what happens when
 * they'd make the same call with curl or their own code.
 */

import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/x-client";
import { log } from "@/lib/logger";
import ENDPOINTS, { buildEndpointUrl } from "@/lib/endpoints";

const BASE_URL = "https://api.x.com";

export async function POST(request) {
  const startTime = Date.now();

  try {
    const bearerToken = getTokenFromRequest(request);
    if (!bearerToken) {
      return NextResponse.json(
        {
          error: "لم تتم إضافة مفتاح الوصول بعد.",
          code: "AUTH_NOT_CONFIGURED",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpointKey, params = {} } = body;

    // Validate endpoint
    const endpoint = ENDPOINTS[endpointKey];
    if (!endpoint) {
      return NextResponse.json(
        { error: `Unknown endpoint: ${endpointKey}`, code: "INVALID_ENDPOINT" },
        { status: 400 }
      );
    }

    // Build URL with path params substituted
    let path = buildEndpointUrl(endpointKey, params);

    // Build query string from non-path params
    const url = new URL(`${BASE_URL}${path}`);
    for (const paramDef of endpoint.params || []) {
      if (paramDef.type === "query") {
        const value = params[paramDef.name];
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(paramDef.name, value);
        } else if (paramDef.default && paramDef.required) {
          url.searchParams.set(paramDef.name, paramDef.default);
        }
      }
    }

    const requestUrl = url.toString();

    log.info("explore", `${endpoint.method} ${endpoint.name}`, {
      endpoint: endpointKey,
      url: requestUrl,
    });

    // Make the actual X API call
    const response = await fetch(requestUrl, {
      method: endpoint.method,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "User-Agent": "x-filtered-stream/2.0.0",
      },
    });

    const responseText = await response.text();
    const elapsed = Date.now() - startTime;

    // Parse JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = null;
    }

    // Extract rate limit headers
    const rateLimit = {
      limit: response.headers.get("x-rate-limit-limit"),
      remaining: response.headers.get("x-rate-limit-remaining"),
      reset: response.headers.get("x-rate-limit-reset"),
    };

    if (response.ok) {
      log.success("explore", `${endpoint.name}: ${response.status} (${elapsed}ms)`);
    } else {
      log.warn("explore", `${endpoint.name}: ${response.status} (${elapsed}ms)`, {
        body: responseText.substring(0, 300),
      });
    }

    return NextResponse.json({
      // The actual API response
      data: responseData,
      raw: responseData ? null : responseText,

      // Metadata for the Explore page
      meta: {
        endpoint: endpointKey,
        method: endpoint.method,
        url: requestUrl,
        status: response.status,
        statusText: response.statusText,
        elapsed,
        rateLimit,
      },

      // User-friendly error info
      ...(response.ok
        ? {}
        : {
            error: getErrorMessage(responseData, response.status),
            hint: getErrorHint(response.status, endpointKey),
          }),
    });
  } catch (error) {
    log.error("explore", `Request failed: ${error.message}`);

    return NextResponse.json(
      {
        error: error.message,
        code: error.code || "REQUEST_FAILED",
        meta: { elapsed: Date.now() - startTime },
      },
      { status: 500 }
    );
  }
}

function getErrorMessage(data, status) {
  if (data?.detail) return data.detail;
  if (data?.errors?.[0]?.message) return data.errors[0].message;
  if (data?.title) return data.title;

  const messages = {
    400: "Bad request — check your parameters",
    401: "Unauthorized — your Bearer Token is invalid or expired",
    403: "Forbidden — this endpoint may require OAuth 2.0 User Context (user token) instead of an App-only Bearer Token",
    404: "Not found — the resource doesn't exist (check the ID/username)",
    429: "Rate limited — you've made too many requests. Check the rate limit info above.",
  };
  return messages[status] || `HTTP ${status} error`;
}

function getErrorHint(status, endpointKey) {
  if (status === 403 && endpointKey === "me") {
    return "The /users/me endpoint requires a User Access Token (OAuth 2.0 User Context). App-only Bearer Tokens get a 403 here — this is expected. Use 'User Lookup by Username' instead.";
  }
  if (status === 403) {
    return "This usually means your API access level doesn't include this endpoint, or it requires OAuth 2.0 User Context.";
  }
  if (status === 429) {
    return "Wait 15 minutes for the rate limit to reset. The 'reset' timestamp in rate limit info shows when.";
  }
  if (status === 404) {
    return "Double-check the ID or username. The resource may have been deleted, or the account may be suspended/private.";
  }
  return null;
}
