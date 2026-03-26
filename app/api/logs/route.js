/**
 * /api/logs — Retrieve activity logs
 *
 * GET /api/logs?category=stream&level=error&limit=50
 * DELETE /api/logs — Clear all logs
 *
 * WHY: Gives users visibility into the app's behavior — what API calls
 * were made, when errors occurred, reconnection attempts, etc.
 * Essential for debugging stream issues.
 */

import { NextResponse } from "next/server";
import { getLogs, clearLogs } from "@/lib/logger";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category") || undefined;
  const level = searchParams.get("level") || undefined;
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = getLogs({ category, level, limit, offset });

  return NextResponse.json(result);
}

export async function DELETE() {
  clearLogs();
  return NextResponse.json({ message: "Logs cleared" });
}
