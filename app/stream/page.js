"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { StatusBadge, ExplainerBox, ErrorDisplay } from "../components/InfoCard";

/**
 * Live Stream Page — View Posts from the Filtered Stream in real-time
 *
 * HOW IT WORKS:
 * 1. You click "Start Stream" — the Bearer Token from localStorage is sent
 *    to the server via the stream start API call
 * 2. The server connects to X's Filtered Stream API using that token
 * 3. This page opens a fetch-based SSE connection to the server
 * 4. The server relays Posts from X to your browser in real-time
 *
 * WHY FETCH-BASED SSE (not EventSource)?
 * EventSource doesn't support custom headers, so we can't send the
 * Bearer Token for auth checking. We use fetch() with a ReadableStream
 * reader instead, which gives us full control over headers.
 *
 * The Bearer Token is sent once in the "start" POST request. The SSE
 * GET connection doesn't need the token because the server already
 * has it from the start call.
 */
export default function StreamPage() {
  const { token, apiFetch } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectInfo, setReconnectInfo] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const postsEndRef = useRef(null);
  const abortRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (autoScroll && !paused && postsEndRef.current) {
      postsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [posts, autoScroll, paused]);

  // Fetch-based SSE connection (supports custom headers if needed)
  const connectSSE = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/stream", { signal: controller.signal })
      .then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              handleSSEMessage(data);
            } catch {
              // Ignore parse errors from heartbeats
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          // Reconnect SSE after a brief delay
          setTimeout(() => {
            if (!controller.signal.aborted) connectSSE();
          }, 3000);
        }
      });

    return () => controller.abort();
  }, []);

  function handleSSEMessage(data) {
    switch (data.type) {
      case "post":
        if (!pausedRef.current) {
          setPosts((prev) => {
            const updated = [...prev, data.data];
            return updated.length > 200 ? updated.slice(-200) : updated;
          });
        }
        break;

      case "status":
        setConnected(data.connected);
        setConnecting(false);
        setReconnectInfo(null);
        if (data.stats) setStats(data.stats);
        break;

      case "reconnecting":
        setConnected(false);
        setConnecting(true);
        setReconnectInfo(data);
        break;

      case "error":
        setError(data);
        setConnecting(false);
        break;

      case "stream_error":
        setError({
          message: `X API: ${data.error?.title || "Unknown error"} — ${data.error?.detail || ""}`,
        });
        break;
    }
  }

  useEffect(() => {
    const cleanup = connectSSE();
    return cleanup;
  }, [connectSSE]);

  async function handleStart() {
    if (!token) {
      setError({ message: "No Bearer Token configured. Add one on the Setup page.", code: "AUTH_NOT_CONFIGURED" });
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      await apiFetch("/api/stream", {
        method: "POST",
        body: JSON.stringify({ action: "start", bearerToken: token }),
      });
    } catch (err) {
      setError({ message: err.message });
      setConnecting(false);
    }
  }

  async function handleStop() {
    try {
      await apiFetch("/api/stream", {
        method: "POST",
        body: JSON.stringify({ action: "stop" }),
      });
      setConnected(false);
    } catch (err) {
      setError({ message: err.message });
    }
  }

  function handleClear() {
    setPosts([]);
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Live Stream
            {connected && <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse-dot" />}
          </h1>
          <p className="text-text-secondary mt-1">
            Real-time Posts from the X Filtered Stream
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={handleStop}
              className="px-4 py-2 bg-error/10 text-error border border-error/20 rounded-lg text-sm font-medium hover:bg-error/20 transition-all-fast"
            >
              Stop Stream
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={connecting || !token}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-all-fast"
            >
              {connecting ? "Connecting..." : "Start Stream"}
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatusBadge
          status={connected ? "success" : connecting ? "warning" : "neutral"}
          label={connected ? "Connected" : connecting ? "Connecting..." : "Disconnected"}
        />
        {stats && (
          <>
            <span className="text-xs text-text-secondary">Posts: {stats.totalPosts || 0}</span>
            <span className="text-xs text-text-secondary">Dupes filtered: {stats.duplicatesFiltered || 0}</span>
            <span className="text-xs text-text-secondary">SSE clients: {stats.connectedClients || 0}</span>
            {stats.uptime > 0 && (
              <span className="text-xs text-text-secondary">Uptime: {formatUptime(stats.uptime)}</span>
            )}
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setPaused(!paused)}
          className={`px-3 py-1 text-xs rounded border transition-all-fast ${
            paused
              ? "bg-warning/10 text-warning border-warning/20"
              : "bg-surface-light text-text-secondary border-border hover:text-text-primary"
          }`}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-3 py-1 text-xs rounded border transition-all-fast ${
            autoScroll
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-surface-light text-text-secondary border-border"
          }`}
        >
          Auto-scroll {autoScroll ? "ON" : "OFF"}
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1 text-xs text-text-secondary border border-border rounded hover:text-text-primary hover:bg-surface-light transition-all-fast"
        >
          Clear
        </button>
      </div>

      {/* Reconnection notice */}
      {reconnectInfo && (
        <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 text-sm text-warning">
          Reconnecting... Attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts}
          {reconnectInfo.reason && ` (${reconnectInfo.reason})`}
          {reconnectInfo.delayMs && ` — waiting ${(reconnectInfo.delayMs / 1000).toFixed(0)}s`}
        </div>
      )}

      {/* Error display */}
      {error && (
        <ErrorDisplay
          error={error.message}
          code={error.code}
          hint={error.code === "AUTH_NOT_CONFIGURED" ? "Add your Bearer Token on the Setup page." : undefined}
          onRetry={handleStart}
        />
      )}

      {/* Posts feed */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Posts {posts.length > 0 && `(${posts.length})`}
          </span>
          {paused && <StatusBadge status="warning" label="Paused" />}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              {connected ? (
                <div>
                  <p className="text-text-secondary text-sm">Waiting for Posts...</p>
                  <p className="text-text-secondary text-xs mt-2">
                    Posts matching your rules will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-text-secondary text-sm">
                    Click &quot;Start Stream&quot; to begin receiving Posts.
                  </p>
                  <ExplainerBox type="info" title="Before you start">
                    Make sure you have at least one rule configured on the Rules page.
                    Without rules, the stream won&apos;t deliver any Posts.
                  </ExplainerBox>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post, index) => (
                <PostCard key={post.data?.id || index} post={post} />
              ))}
              <div ref={postsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <InfoCard
        title="How the Live Stream Works"
        description="Understanding the real-time data flow"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-3 px-4 bg-surface-light rounded-lg text-xs overflow-x-auto">
            <PipelineStep label="Browser" sub="Token in localStorage" />
            <Arr />
            <PipelineStep label="Server" sub="Connects to X API" />
            <Arr />
            <PipelineStep label="X API" sub="Filtered Stream" />
            <Arr />
            <PipelineStep label="SSE" sub="Pushes to browser" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Deduplication</p>
              <p className="text-text-secondary text-xs mt-1">
                Duplicate Posts (from backfill or recovery) are automatically filtered out
                before reaching your browser.
              </p>
            </div>
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Auto-reconnect</p>
              <p className="text-text-secondary text-xs mt-1">
                If the X API connection drops, the server automatically reconnects using
                smart backoff (250ms for network, 5s for HTTP, 60s for rate limits).
              </p>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

function PostCard({ post }) {
  const data = post.data;
  if (!data) return null;

  const user = post.includes?.users?.find((u) => u.id === data.author_id);
  const matchingRules = post.matching_rules || [];

  return (
    <div className="p-4 hover:bg-surface-light/50 transition-all-fast">
      <div className="flex items-center gap-2 mb-2">
        {user?.profile_image_url && (
          <img src={user.profile_image_url} alt={user.name} className="w-8 h-8 rounded-full" />
        )}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="font-medium text-sm text-text-primary">{user.name}</span>
              <span className="text-text-secondary text-sm">@{user.username}</span>
              {user.verified_type && <StatusBadge status="info" label={user.verified_type} />}
            </>
          ) : (
            <span className="text-text-secondary text-sm">User {data.author_id}</span>
          )}
        </div>
        <span className="text-xs text-text-secondary ml-auto">
          {data.created_at ? new Date(data.created_at).toLocaleTimeString() : ""}
        </span>
      </div>

      <p className="text-sm text-text-primary whitespace-pre-wrap break-words">{data.text}</p>

      <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
        {data.public_metrics && (
          <>
            <span title="Likes">{"\u2665"} {data.public_metrics.like_count}</span>
            <span title="Retweets">{"\u21bb"} {data.public_metrics.retweet_count}</span>
            <span title="Replies">{"\ud83d\udcac"} {data.public_metrics.reply_count}</span>
          </>
        )}
        {data.lang && <span>Lang: {data.lang}</span>}
        {data.source && <span>Via: {data.source}</span>}
      </div>

      {matchingRules.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-text-secondary">Matched:</span>
          {matchingRules.map((rule) => (
            <span key={rule.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {rule.tag || rule.id}
            </span>
          ))}
        </div>
      )}

      {data.entities?.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.entities.hashtags.map((h, i) => (
            <span key={i} className="text-xs text-primary">#{h.tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineStep({ label, sub }) {
  return (
    <div className="text-center px-3 py-1.5 bg-surface-lighter rounded flex-shrink-0">
      <div className="font-medium text-text-primary text-xs">{label}</div>
      <div className="text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function Arr() {
  return <span className="text-text-secondary flex-shrink-0 text-xs">&rarr;</span>;
}

function formatUptime(seconds) {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
