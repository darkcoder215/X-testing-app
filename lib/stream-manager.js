/**
 * Server-side Stream Manager (singleton)
 *
 * Manages a single Filtered Stream connection and broadcasts
 * events to all connected SSE clients (browser tabs).
 *
 * WHY: The X API allows only 1 stream connection per project (pay-per-use).
 * This manager ensures we have at most one connection, and fans out
 * received Posts to all browser clients via Server-Sent Events.
 *
 * Architecture:
 *   X API Stream ──→ StreamManager ──→ SSE Client 1
 *                                  ──→ SSE Client 2
 *                                  ──→ SSE Client N
 */

import { apiStream } from "./x-client.js";
import { log } from "./logger.js";

class StreamManager {
  constructor() {
    /** @type {Set<(data: string) => void>} Connected SSE writers */
    this.clients = new Set();

    /** @type {boolean} Whether we're currently connected to X */
    this.connected = false;

    /** @type {boolean} Whether we're in the process of connecting */
    this.connecting = false;

    /** @type {AbortController|null} For cancelling the stream */
    this.abortController = null;

    /** @type {Object} Real-time stats */
    this.stats = {
      totalPosts: 0,
      duplicatesFiltered: 0,
      connectedAt: null,
      reconnectAttempts: 0,
      lastPostAt: null,
      errors: [],
    };

    /** @type {Set<string>} Deduplication set */
    this.seenIds = new Set();
    this.maxSeenIds = 50000;

    /** @type {string|null} Bearer Token for X API calls */
    this.bearerToken = null;

    /** @type {boolean} Whether shutdown has been requested */
    this.shuttingDown = false;
  }

  /**
   * Add an SSE client. Returns a cleanup function.
   */
  addClient(writer) {
    this.clients.add(writer);
    log.info("stream", `SSE client connected (${this.clients.size} total)`);

    // Send current status immediately
    writer(JSON.stringify({
      type: "status",
      connected: this.connected,
      stats: this.getStats(),
    }));

    return () => {
      this.clients.delete(writer);
      log.info("stream", `SSE client disconnected (${this.clients.size} total)`);
    };
  }

  /**
   * Broadcast a message to all connected SSE clients.
   */
  broadcast(data) {
    const message = typeof data === "string" ? data : JSON.stringify(data);
    for (const writer of this.clients) {
      try {
        writer(message);
      } catch {
        this.clients.delete(writer);
      }
    }
  }

  /**
   * Get current stream stats.
   */
  getStats() {
    return {
      ...this.stats,
      connectedClients: this.clients.size,
      uptime: this.stats.connectedAt
        ? Math.floor((Date.now() - new Date(this.stats.connectedAt).getTime()) / 1000)
        : 0,
    };
  }

  /**
   * Start the stream connection. Idempotent — if already connected, returns.
   * @param {string} bearerToken - Bearer Token from the browser (localStorage)
   */
  async start(bearerToken) {
    if (this.connected || this.connecting) {
      return { alreadyConnected: true };
    }

    if (bearerToken) this.bearerToken = bearerToken;

    this.connecting = true;
    this.shuttingDown = false;
    this.stats.reconnectAttempts = 0;

    log.info("stream", "Starting Filtered Stream connection...");
    this.broadcast({ type: "status", connected: false, connecting: true });

    try {
      await this._connectWithRetry();
    } catch (error) {
      this.connecting = false;
      log.error("stream", `Failed to start stream: ${error.message}`);
      this.broadcast({ type: "error", message: error.message, code: error.code });
      throw error;
    }
  }

  /**
   * Stop the stream connection.
   */
  stop() {
    this.shuttingDown = true;
    this.connected = false;
    this.connecting = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    log.info("stream", "Stream disconnected by user", this.getStats());
    this.broadcast({ type: "status", connected: false, stats: this.getStats() });
  }

  /**
   * Connect with per-error-type retry logic.
   */
  async _connectWithRetry() {
    const MAX_ATTEMPTS = 10;

    while (!this.shuttingDown) {
      try {
        await this._connect();
      } catch (error) {
        if (this.shuttingDown) break;

        this.connected = false;
        this.stats.reconnectAttempts++;

        if (this.stats.reconnectAttempts > MAX_ATTEMPTS) {
          log.error("stream", `Max reconnection attempts (${MAX_ATTEMPTS}) reached`);
          this.broadcast({ type: "error", message: "Max reconnection attempts reached. Click Start to retry." });
          this.connecting = false;
          return;
        }

        const delay = this._getDelay(error);
        const reason = error.status === 429
          ? "Rate limited"
          : error.status
            ? `HTTP ${error.status}`
            : "Network error";

        log.warn("stream", `${reason}: reconnecting in ${(delay / 1000).toFixed(0)}s (attempt ${this.stats.reconnectAttempts}/${MAX_ATTEMPTS})`, {
          error: error.message,
        });

        this.stats.errors.push({
          time: new Date().toISOString(),
          message: error.message,
          status: error.status,
        });
        // Keep only last 20 errors
        if (this.stats.errors.length > 20) this.stats.errors.shift();

        this.broadcast({
          type: "reconnecting",
          attempt: this.stats.reconnectAttempts,
          maxAttempts: MAX_ATTEMPTS,
          delayMs: delay,
          reason,
        });

        await sleep(delay);
      }
    }
  }

  async _connect() {
    const params = {
      "tweet.fields": "author_id,created_at,lang,public_metrics,entities,source,edit_controls",
      expansions: "author_id",
      "user.fields": "name,username,profile_image_url,verified,verified_type",
    };

    const response = await apiStream("/tweets/search/stream", {
      params,
      bearerToken: this.bearerToken,
    });

    this.connected = true;
    this.connecting = false;
    this.stats.connectedAt = new Date().toISOString();
    this.stats.reconnectAttempts = 0;

    log.success("stream", "Connected to Filtered Stream");
    this.broadcast({ type: "status", connected: true, stats: this.getStats() });

    await this._processResponse(response);
  }

  async _processResponse(response) {
    const decoder = new TextDecoder();
    let buffer = "";
    let lastDataTime = Date.now();

    // Heartbeat monitor — X sends keep-alive every 20s
    const heartbeatCheck = setInterval(() => {
      if (Date.now() - lastDataTime > 25000) {
        clearInterval(heartbeatCheck);
        throw new Error("Heartbeat timeout — no data received for 25 seconds");
      }
    }, 5000);

    try {
      for await (const chunk of response.body) {
        if (this.shuttingDown) break;

        lastDataTime = Date.now();
        buffer += decoder.decode(chunk, { stream: true });

        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue; // keep-alive

          try {
            const data = JSON.parse(line);

            // Handle in-stream errors from X
            if (data.errors) {
              for (const err of data.errors) {
                log.error("stream", `X API: ${err.title} — ${err.detail || ""}`, err);
                this.broadcast({ type: "stream_error", error: err });
              }
              continue;
            }

            // Deduplication
            const postId = data?.data?.id;
            if (postId) {
              if (this.seenIds.has(postId)) {
                this.stats.duplicatesFiltered++;
                continue;
              }
              this.seenIds.add(postId);
              if (this.seenIds.size > this.maxSeenIds) {
                const iter = this.seenIds.values();
                for (let i = 0; i < this.maxSeenIds / 4; i++) {
                  this.seenIds.delete(iter.next().value);
                }
              }
            }

            this.stats.totalPosts++;
            this.stats.lastPostAt = new Date().toISOString();

            this.broadcast({ type: "post", data });
          } catch (parseError) {
            log.warn("stream", `Failed to parse stream data: ${parseError.message}`);
          }
        }
      }
    } finally {
      clearInterval(heartbeatCheck);
    }

    throw new Error("Stream connection closed by server");
  }

  _getDelay(error) {
    const attempt = this.stats.reconnectAttempts;
    if (error.status === 429) return 60000 * Math.pow(2, attempt - 1);
    if (error.status) return Math.min(5000 * Math.pow(2, attempt - 1), 320000);
    return Math.min(250 * attempt, 16000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton — one stream manager per server process
const streamManager = new StreamManager();
export default streamManager;
