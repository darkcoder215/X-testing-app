/**
 * /api/rules — Manage Filtered Stream rules
 *
 * GET  /api/rules — List all current rules
 * POST /api/rules — Add new rules or delete existing ones
 *
 * TOKEN: Read from "X-Bearer-Token" header (browser) or env var (fallback).
 *
 * WHY: Rules determine which Posts appear in your stream. You can have
 * up to 1,000 rules (pay-per-use) or 25,000+ (Enterprise). Rules persist
 * on X's servers — you don't need to re-add them after reconnecting.
 */

import { NextResponse } from "next/server";
import { apiRequest, getTokenFromRequest } from "@/lib/x-client";
import { log } from "@/lib/logger";

const RULES_PATH = "/tweets/search/stream/rules";

/**
 * GET /api/rules — List all active stream rules
 */
export async function GET(request) {
  try {
    const bearerToken = getTokenFromRequest(request);
    const data = await apiRequest("GET", RULES_PATH, { bearerToken });
    const rules = data.data || [];
    const meta = data.meta || {};

    log.info("rules", `Listed ${rules.length} rule(s)`);

    return NextResponse.json({
      rules,
      meta,
      message: rules.length === 0
        ? "No rules configured. Add rules to start receiving Posts."
        : `${rules.length} active rule(s)`,
    });
  } catch (error) {
    log.error("rules", `Failed to list rules: ${error.message}`);

    return NextResponse.json(
      {
        rules: [],
        error: error.message,
        code: error.code || "UNKNOWN",
        hint: error.code === "AUTH_NOT_CONFIGURED"
          ? "Add your Bearer Token on the Setup page first."
          : error.code === "AUTH_INVALID"
            ? "Your Bearer Token is invalid. Update it on the Setup page."
            : "Check the Logs page for more details.",
      },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/rules — Add or delete rules
 *
 * Body for adding:    { "add": [{ "value": "...", "tag": "..." }] }
 * Body for deleting:  { "delete": { "ids": ["123", "456"] } }
 * Body for delete-all: { "deleteAll": true }
 */
export async function POST(request) {
  try {
    const bearerToken = getTokenFromRequest(request);
    const body = await request.json();

    // Handle delete-all
    if (body.deleteAll) {
      const current = await apiRequest("GET", RULES_PATH, { bearerToken });
      const rules = current.data || [];

      if (rules.length === 0) {
        return NextResponse.json({ message: "No rules to delete.", meta: { deleted: 0 } });
      }

      const ids = rules.map((r) => r.id);
      const result = await apiRequest("POST", RULES_PATH, {
        body: { delete: { ids } },
        bearerToken,
      });

      log.success("rules", `Deleted all ${ids.length} rule(s)`);
      return NextResponse.json({
        message: `Deleted ${ids.length} rule(s).`,
        meta: result.meta,
      });
    }

    // Handle delete by IDs
    if (body.delete) {
      const ids = body.delete.ids || [];
      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No rule IDs provided", code: "VALIDATION" },
          { status: 400 }
        );
      }

      const result = await apiRequest("POST", RULES_PATH, {
        body: { delete: { ids } },
        bearerToken,
      });

      log.success("rules", `Deleted ${ids.length} rule(s)`, { ids });
      return NextResponse.json({
        message: `Deleted ${ids.length} rule(s).`,
        meta: result.meta,
      });
    }

    // Handle add
    if (body.add) {
      const rules = body.add;

      for (const rule of rules) {
        if (!rule.value || !rule.value.trim()) {
          return NextResponse.json(
            { error: "Each rule must have a non-empty 'value' field.", code: "VALIDATION" },
            { status: 400 }
          );
        }
        if (rule.value.length > 2048) {
          return NextResponse.json(
            { error: `Rule too long (${rule.value.length} chars). Max is 2048 (Enterprise) or 1024 (pay-per-use).`, code: "VALIDATION" },
            { status: 400 }
          );
        }
      }

      const result = await apiRequest("POST", RULES_PATH, {
        body: { add: rules },
        bearerToken,
      });

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map(
          (e) => `${e.title}: ${e.value || e.detail || ""}`
        );
        log.warn("rules", `Some rules failed: ${errorMessages.join("; ")}`);
        return NextResponse.json({
          message: "Some rules could not be created.",
          errors: result.errors,
          meta: result.meta,
          data: result.data,
        });
      }

      const created = result.meta?.summary?.created || rules.length;
      log.success("rules", `Added ${created} rule(s)`, { rules: rules.map((r) => r.value) });

      return NextResponse.json({
        message: `Added ${created} rule(s).`,
        data: result.data,
        meta: result.meta,
      });
    }

    return NextResponse.json(
      { error: "Request must include 'add', 'delete', or 'deleteAll'.", code: "VALIDATION" },
      { status: 400 }
    );
  } catch (error) {
    log.error("rules", `Rule operation failed: ${error.message}`);

    return NextResponse.json(
      {
        error: error.message,
        code: error.code || "UNKNOWN",
        hint: error.code === "AUTH_NOT_CONFIGURED"
          ? "Add your Bearer Token on the Setup page first."
          : "Check the Logs page for more details.",
      },
      { status: error.status || 500 }
    );
  }
}
