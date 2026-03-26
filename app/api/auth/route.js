/**
 * POST /api/auth — Validate a Bearer Token against the X API
 *
 * WHY: Before saving credentials, we verify they work by making
 * a lightweight call to the rules endpoint. This prevents users
 * from getting stuck with invalid tokens.
 *
 * Request body: { "bearerToken": "AAA..." }
 * Response: { "valid": true/false, "message": "...", "details": {...} }
 */

import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export async function POST(request) {
  try {
    const { bearerToken } = await request.json();

    if (!bearerToken || !bearerToken.trim()) {
      return NextResponse.json(
        { valid: false, message: "Bearer Token is required", code: "EMPTY_TOKEN" },
        { status: 400 }
      );
    }

    log.info("auth", "Validating Bearer Token...");

    // Test the token by calling the rules endpoint (lightweight, no side effects)
    const response = await fetch(
      "https://api.x.com/2/tweets/search/stream/rules",
      {
        headers: {
          Authorization: `Bearer ${bearerToken.trim()}`,
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
        message: `Token is valid. You have ${ruleCount} existing rule(s).`,
        details: { ruleCount },
      });
    }

    // Parse error response
    const errorBody = await response.text();
    let errorMessage = `HTTP ${response.status}`;

    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.detail || parsed.title || errorMessage;
    } catch {
      // Use status code message
    }

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
 * GET /api/auth — Check if a Bearer Token is currently configured
 *
 * Does NOT return the actual token — just whether one is set.
 */
export async function GET() {
  const token = process.env.X_BEARER_TOKEN;
  const configured = Boolean(token && token !== "your_bearer_token_here");

  return NextResponse.json({
    configured,
    message: configured
      ? "Bearer Token is configured"
      : "No Bearer Token configured. Go to Setup to add one.",
  });
}
