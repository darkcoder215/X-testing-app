/**
 * In-memory activity logger for the dashboard.
 *
 * WHY: Gives users visibility into what the app is doing — API calls,
 * stream events, errors, and reconnections. Stored in memory so it
 * works on any deployment (no database needed). Logs are lost on restart,
 * which is fine for a monitoring tool.
 *
 * Each log entry has:
 * - id: unique identifier
 * - timestamp: ISO 8601 date string
 * - level: "info" | "warn" | "error" | "success"
 * - category: "auth" | "rules" | "stream" | "recovery" | "system"
 * - message: human-readable description
 * - details: optional extra data (truncated for display)
 */

const MAX_LOGS = 500;
let logs = [];
let nextId = 1;

export function addLog(level, category, message, details = null) {
  const entry = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details: details ? truncate(JSON.stringify(details), 500) : null,
  };

  logs.unshift(entry); // newest first

  // Keep only the last MAX_LOGS entries
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(0, MAX_LOGS);
  }

  return entry;
}

export function getLogs({ category, level, limit = 100, offset = 0 } = {}) {
  let filtered = logs;

  if (category) {
    filtered = filtered.filter((l) => l.category === category);
  }
  if (level) {
    filtered = filtered.filter((l) => l.level === level);
  }

  return {
    logs: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export function clearLogs() {
  logs = [];
  nextId = 1;
}

// Shorthand methods
export const log = {
  info: (category, message, details) => addLog("info", category, message, details),
  warn: (category, message, details) => addLog("warn", category, message, details),
  error: (category, message, details) => addLog("error", category, message, details),
  success: (category, message, details) => addLog("success", category, message, details),
};

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + "...";
}
