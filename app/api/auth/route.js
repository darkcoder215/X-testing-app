/**
 * /api/auth — Validate and check Bearer Token status
 *
 * POST /api/auth — Validate a token (sent in request body or header)
 * GET  /api/auth — Check if a token is available (header or env var)
 *
 * TOKEN RESOLUTION:
 * 1. "X-Bearer-Token" request header (from browser localStorage)
 * 2. Request body `bearerToken` field (for validation flow)
 * 3. X_BEARER_TOKEN env var (fallback)
 *
 * WHY: Before streaming, we verify the token works by making
 * a lightweight call to the rules endpoint. This prevents users
 * from getting stuck with invalid tokens.
 */

import { NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/x-client";
import { log } from "@/lib/logger";

export async function POST(request) {
  try {
    const body = await request.json();

    // Use token from body (validation flow) or from header (status check)
    const bearerToken = body.bearerToken?.trim() || getTokenFromRequest(request);

    if (!bearerToken) {
      return NextResponse.json(
        { valid: false, message: "Bearer Token is required", code: "EMPTY_TOKEN" },
        { status: 400 }
      );
    }

    log.info("auth", "Validating Bearer Token...");

    const response = await fetch(
      "https://api.x.com/2/tweets/search/stream/rules",
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "User-Agent": "x-filtered-stream/2.0.0",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const ruleCount = data.meta?.result_count || 0;

      log.success("auth", `Bearer Token validated successfully (${ruleCount} existing rules)`);

      return NextResponse.json({
        valid: true,
        message: `Token is valid! You have ${ruleCount} existing rule(s).`,
        details: { ruleCount },
      });
    }

    const errorBody = await response.text();
    let errorMessage = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.detail || parsed.title || errorMessage;
    } catch { /* use status message */ }

    const statusMessages = {
      401: "Invalid Bearer Token. Check that you copied it correctly from the Developer Portal.",
      403: "Token is valid but lacks permission. Ensure your App has the correct access level.",
      429: "Rate limited. Your token appears valid, but wait a minute before trying again.",
    };

    log.error("auth", `Token validation failed: ${response.status} — ${errorMessage}`);

    return NextResponse.json({
      valid: false,
      message: statusMessages[response.status] || errorMessage,
      code: response.status === 401 ? "AUTH_INVALID" : "API_ERROR",
      status: response.status,
    });
  } catch (error) {
    log.error("auth", `Validation error: ${error.message}`);

    return NextResponse.json(
      {
        valid: false,
        message: error.message.includes("fetch")
          ? "Could not reach the X API. Check your network connection."
          : error.message,
        code: "NETWORK_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth — Check if a Bearer Token is available
 *
 * Checks both the request header (browser localStorage) and env var.
 * Does NOT return the actual token — just whether one is available.
 */
export async function GET(request) {
  const token = getTokenFromRequest(request);
  const configured = Boolean(token);

  return NextResponse.json({
    configured,
    source: token
      ? (request.headers.get("x-bearer-token") ? "browser" : "environment")
      : null,
    message: configured
      ? "Bearer Token is configured"
      : "No Bearer Token found. Add one on the Setup page.",
  });
}
