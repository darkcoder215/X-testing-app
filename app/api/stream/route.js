/**
 * /api/stream — Server-Sent Events endpoint for the Filtered Stream
 *
 * GET  /api/stream         → Connect to SSE and receive Posts in real-time
 * POST /api/stream         → Start or stop the stream
 *
 * WHY: The browser cannot connect directly to the X API stream
 * (it requires a Bearer Token and server-side processing). This endpoint
 * bridges the gap: the server maintains one connection to X, and
 * broadcasts Posts to all browser tabs via SSE.
 *
 * Architecture:
 *   Browser ←SSE→ This Route ←→ StreamManager ←HTTP→ X API
 */

import { NextResponse } from "next/server";
import streamManager from "@/lib/stream-manager";
import { log } from "@/lib/logger";

/**
 * GET /api/stream — Connect to Server-Sent Events
 *
 * Opens a long-lived SSE connection. The browser receives events:
 * - type: "post"         → A matching Post from the stream
 * - type: "status"       → Connection status update
 * - type: "reconnecting" → Stream is reconnecting after error
 * - type: "error"        → An error occurred
 * - type: "stream_error" → In-stream error from X API
 */
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Writer function: formats data as SSE and sends to client
      const writer = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      const cleanup = streamManager.addClient(writer);

      // Send a heartbeat every 15s to keep the connection alive
      // through proxies and load balancers
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          cleanup();
        }
      }, 15000);

      // Cleanup when the client disconnects
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
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

/**
 * POST /api/stream — Start or stop the stream
 *
 * Body: { "action": "start" | "stop" | "status" }
 */
export async function POST(request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "start": {
        // Start is async — don't await the full connection, just initiate
        streamManager.start().catch((error) => {
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
