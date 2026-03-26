"use client";

import { useState, useEffect, useCallback } from "react";
import InfoCard, { StatusBadge, ExplainerBox } from "../components/InfoCard";

/**
 * Logs Page — View activity logs and debug information
 *
 * This page shows:
 * - All API calls made by the app
 * - Stream connection events (connects, disconnects, errors)
 * - Rule management operations
 * - Authentication events
 *
 * WHY THIS PAGE EXISTS:
 * When something goes wrong with streaming, logs are the first place
 * to look. They show exactly what happened, when, and why — making it
 * easy to diagnose issues like invalid tokens, rate limits, or rule errors.
 *
 * STORAGE: Logs are stored in server memory (up to 500 entries).
 * They reset when the server restarts. For persistent logs, consider
 * integrating with an external logging service.
 */
export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", level: "" });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.category) params.set("category", filters.category);
      if (filters.level) params.set("level", filters.level);

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      // Silently fail — logs are non-critical
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  async function handleClear() {
    if (!confirm("Clear all logs?")) return;
    await fetch("/api/logs", { method: "DELETE" });
    fetchLogs();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Logs</h1>
          <p className="text-text-secondary mt-1">
            Track API calls, stream events, and errors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 text-xs rounded border transition-all-fast ${
              autoRefresh
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-surface-light text-text-secondary border-border"
            }`}
          >
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 text-xs text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-light transition-all-fast"
          >
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-error border border-error/20 rounded hover:bg-error/10 transition-all-fast"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-text-secondary">Filter:</span>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-3 py-1.5 bg-surface-light border border-border rounded text-sm text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="">All categories</option>
          <option value="auth">Authentication</option>
          <option value="rules">Rules</option>
          <option value="stream">Stream</option>
          <option value="recovery">Recovery</option>
          <option value="system">System</option>
        </select>

        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          className="px-3 py-1.5 bg-surface-light border border-border rounded text-sm text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="">All levels</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>

        <span className="text-xs text-text-secondary ml-auto">
          {total} log{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Log entries */}
      <InfoCard>
        {loading ? (
          <p className="text-text-secondary text-sm">Loading logs...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm">No logs yet.</p>
            <p className="text-text-secondary text-xs mt-1">
              Activity will appear here as you use the app.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </InfoCard>

      {/* Explanation */}
      <InfoCard title="Understanding Logs" description="What each log level means">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
            <StatusBadge status="info" label="Info" />
            <p className="text-xs text-text-secondary">
              Normal operations — API calls, connections, and status changes.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
            <StatusBadge status="success" label="Success" />
            <p className="text-xs text-text-secondary">
              Successful operations — token validated, rules added, stream connected.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
            <StatusBadge status="warning" label="Warning" />
            <p className="text-xs text-text-secondary">
              Non-critical issues — reconnection attempts, volume drops, partial failures.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-surface-light rounded-lg">
            <StatusBadge status="error" label="Error" />
            <p className="text-xs text-text-secondary">
              Failures — authentication errors, API errors, stream disconnections.
            </p>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);

  const levelColors = {
    info: "text-info",
    success: "text-success",
    warn: "text-warning",
    error: "text-error",
  };

  const levelLabels = {
    info: "INFO",
    success: "OK",
    warn: "WARN",
    error: "ERR",
  };

  const time = new Date(entry.timestamp).toLocaleTimeString();

  return (
    <div
      className="flex items-start gap-3 py-2 px-3 rounded hover:bg-surface-light cursor-pointer text-xs font-mono"
      onClick={() => entry.details && setExpanded(!expanded)}
    >
      <span className="text-text-secondary flex-shrink-0 w-16">{time}</span>
      <span className={`flex-shrink-0 w-10 font-bold ${levelColors[entry.level]}`}>
        {levelLabels[entry.level]}
      </span>
      <span className="flex-shrink-0 w-16 text-text-secondary">{entry.category}</span>
      <div className="flex-1 min-w-0">
        <span className="text-text-primary">{entry.message}</span>
        {entry.details && (
          <span className="text-text-secondary ml-2">
            {expanded ? "[-]" : "[+]"}
          </span>
        )}
        {expanded && entry.details && (
          <pre className="mt-1 text-text-secondary bg-black/30 p-2 rounded overflow-x-auto">
            {entry.details}
          </pre>
        )}
      </div>
    </div>
  );
}
