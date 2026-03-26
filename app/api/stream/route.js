/**
 * /api/stream — Server-Sent Events endpoint for the Filtered Stream
 *
 * GET  /api/stream — Connect to SSE and receive Posts in real-time
 * POST /api/stream — Start, stop, or check stream status
 *
 * TOKEN: The stream start action accepts the token in the request body
 * (since the browser sends it from localStorage). The token is stored
 * in the StreamManager for the duration of the connection.
 *
 * Architecture:
 *   Browser ←SSE→ This Route ←→ StreamManager ←HTTP→ X API
 */

import { NextResponse } from "next/server";
import streamManager from "@/lib/stream-manager";
import { getTokenFromRequest } from "@/lib/x-client";
import { log } from "@/lib/logger";

/**
 * GET /api/stream — Connect to Server-Sent Events
 *
 * Opens a long-lived SSE connection. The browser receives events:
 * - type: "post"         → A matching Post
 * - type: "status"       → Connection status update
 * - type: "reconnecting" → Stream is reconnecting
 * - type: "error"        → An error occurred
 * - type: "stream_error" → In-stream error from X API
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const writer = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      const cleanup = streamManager.addClient(writer);

      // Heartbeat every 15s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 15000);

      const originalCancel = controller.close.bind(controller);
      controller.close = () => {
        clearInterval(heartbeat);
        cleanup();
        originalCancel();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST /api/stream — Start, stop, or check stream status
 *
 * Body: { "action": "start" | "stop" | "status", "bearerToken"?: "..." }
 *
 * The "start" action accepts an optional bearerToken in the body.
 * This is the token from the browser's localStorage, passed here
 * so the StreamManager can use it for the X API connection.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Resolve token: body > header > env
    const bearerToken = body.bearerToken || getTokenFromRequest(request);

    switch (action) {
      case "start": {
        if (!bearerToken) {
          return NextResponse.json(
            {
              error: "No Bearer Token available. Add one on the Setup page.",
              code: "AUTH_NOT_CONFIGURED",
            },
            { status: 401 }
          );
        }

        // Pass the token to the stream manager so it can connect to X
        streamManager.start(bearerToken).catch((error) => {
          log.error("stream", `Stream start failed: ${error.message}`);
        });

        return NextResponse.json({
          message: "Stream connection initiated",
          stats: streamManager.getStats(),
        });
      }

      case "stop": {
        streamManager.stop();
        return NextResponse.json({
          message: "Stream disconnected",
          stats: streamManager.getStats(),
        });
      }

      case "status": {
        return NextResponse.json({
          connected: streamManager.connected,
          connecting: streamManager.connecting,
          stats: streamManager.getStats(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use 'start', 'stop', or 'status'.` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error("stream", `Stream control error: ${error.message}`);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }
}
