import client from "../lib/client.js";
import config from "../lib/config.js";

const STREAM_ENDPOINT = config.api.streamEndpoint;

// ---------------------------------------------------------------------------
// FIFO Queue — decouples stream ingestion from processing
// ---------------------------------------------------------------------------
class PostQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.handler = null;
  }

  setHandler(fn) {
    this.handler = fn;
  }

  push(data) {
    this.queue.push(data);
    if (!this.processing) this._drain();
  }

  async _drain() {
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      try {
        await this.handler(item);
      } catch (err) {
        console.error("Error processing post:", err.message);
      }
    }
    this.processing = false;
  }
}

// ---------------------------------------------------------------------------
// Volume Tracker — monitors post throughput for anomaly detection
// ---------------------------------------------------------------------------
class VolumeTracker {
  constructor(intervalMs, alertThresholdPercent) {
    this.intervalMs = intervalMs;
    this.alertThresholdPercent = alertThresholdPercent;
    this.currentCount = 0;
    this.previousCount = 0;
    this.totalCount = 0;
    this.startTime = Date.now();
    this.timer = null;
  }

  start() {
    this.startTime = Date.now();
    this.timer = setInterval(() => this._tick(), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  record() {
    this.currentCount++;
    this.totalCount++;
  }

  getStats() {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    return {
      total: this.totalCount,
      currentWindow: this.currentCount,
      previousWindow: this.previousCount,
      postsPerSecond: elapsedSec > 0 ? (this.totalCount / elapsedSec).toFixed(2) : 0,
      elapsed: formatDuration(elapsedSec),
    };
  }

  _tick() {
    if (this.previousCount > 0 && this.currentCount > 0) {
      const dropPercent = ((this.previousCount - this.currentCount) / this.previousCount) * 100;
      if (dropPercent >= this.alertThresholdPercent) {
        console.warn(
          `\n⚠ Volume alert: ${dropPercent.toFixed(0)}% drop (${this.previousCount} → ${this.currentCount} posts in last window)`
        );
      }
    }
    this.previousCount = this.currentCount;
    this.currentCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Deduplication — track seen post IDs to filter duplicates (from backfill/recovery)
// ---------------------------------------------------------------------------
class Deduplicator {
  constructor(maxSize = 50000) {
    this.seen = new Set();
    this.maxSize = maxSize;
    this.duplicateCount = 0;
  }

  isDuplicate(postId) {
    if (this.seen.has(postId)) {
      this.duplicateCount++;
      return true;
    }
    this.seen.add(postId);
    // Evict oldest entries when set grows too large
    if (this.seen.size > this.maxSize) {
      const iterator = this.seen.values();
      for (let i = 0; i < this.maxSize / 4; i++) {
        this.seen.delete(iterator.next().value);
      }
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Reconnection strategies per the X docs
// ---------------------------------------------------------------------------

function getReconnectDelay(error, attempt) {
  const { reconnect } = config;

  // Rate limit (HTTP 429): exponential from 60s, doubling each attempt
  if (error.status === 429) {
    const delay = reconnect.rateLimitInitialDelayMs * Math.pow(2, attempt - 1);
    return delay; // no cap — keep doubling until rate limit expires
  }

  // HTTP errors (4xx/5xx): exponential from 5s, cap 320s
  if (error.status) {
    const delay = reconnect.httpInitialDelayMs * Math.pow(2, attempt - 1);
    return Math.min(delay, reconnect.httpMaxDelayMs);
  }

  // TCP/IP / network errors: linear +250ms per attempt, cap 16s
  const delay = reconnect.tcpInitialDelayMs * attempt;
  return Math.min(delay, reconnect.tcpMaxDelayMs);
}

// ---------------------------------------------------------------------------
// Main stream connection
// ---------------------------------------------------------------------------

/**
 * Connect to the Filtered Stream and process incoming Posts.
 *
 * Implements:
 * - FIFO queue architecture (decouple ingestion from processing)
 * - Keep-alive heartbeat monitoring (20s timeout per X docs)
 * - Per-error-type reconnection strategies (TCP linear, HTTP exponential, 429 special)
 * - Volume tracking with anomaly alerts
 * - Post deduplication (for backfill/recovery overlap)
 * - Graceful shutdown on SIGINT/SIGTERM
 *
 * @param {Function} onPost - Callback invoked with each Post object
 * @param {Object} [options] - Override stream options
 */
export async function connectToStream(onPost, options = {}) {
  const { maxAttempts } = config.reconnect;
  let reconnectAttempts = 0;
  let isShuttingDown = false;
  let disconnectedAt = null;

  // Set up FIFO queue
  const postQueue = new PostQueue();
  const deduplicator = new Deduplicator();
  const volumeTracker = new VolumeTracker(
    config.volume.trackingIntervalMs,
    config.volume.alertThresholdPercent
  );

  postQueue.setHandler(async (data) => {
    const postId = data?.data?.id;
    if (postId && deduplicator.isDuplicate(postId)) return;
    volumeTracker.record();
    await onPost(data);
  });

  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    volumeTracker.stop();
    const stats = volumeTracker.getStats();
    console.log("\nDisconnecting from stream...");
    console.log(`  Total posts received: ${stats.total}`);
    console.log(`  Duplicates filtered: ${deduplicator.duplicateCount}`);
    console.log(`  Avg rate: ${stats.postsPerSecond} posts/sec`);
    console.log(`  Session duration: ${stats.elapsed}`);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const params = buildStreamParams(options);

  volumeTracker.start();

  while (!isShuttingDown) {
    try {
      console.log("Connecting to Filtered Stream...");

      // If reconnecting and we know how long we were disconnected, use backfill
      if (disconnectedAt && config.stream.backfillMinutes > 0) {
        const disconnectedMinutes = Math.ceil((Date.now() - disconnectedAt) / 60000);
        const backfill = Math.min(disconnectedMinutes, config.stream.backfillMinutes, 5);
        if (backfill > 0) {
          params.backfill_minutes = backfill;
          console.log(`  Requesting ${backfill} minute(s) of backfill...`);
        }
      }

      const response = await client.stream(STREAM_ENDPOINT, params);

      // Reset reconnect state on successful connection
      reconnectAttempts = 0;
      disconnectedAt = null;
      console.log("Connected. Waiting for Posts...\n");

      await processStream(response, postQueue);
    } catch (error) {
      if (isShuttingDown) break;

      if (!disconnectedAt) disconnectedAt = Date.now();
      reconnectAttempts++;

      if (reconnectAttempts > maxAttempts) {
        console.error(`Max reconnection attempts (${maxAttempts}) reached. Exiting.`);
        const stats = volumeTracker.getStats();
        console.log(`  Total posts received: ${stats.total}`);
        process.exit(1);
      }

      const delay = getReconnectDelay(error, reconnectAttempts);

      if (error.status === 429) {
        console.error(`Rate limited (429). Waiting ${(delay / 1000).toFixed(0)}s before retry...`);
      } else if (error.status) {
        console.error(`HTTP ${error.status}: ${error.message}`);
        console.error(`Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${reconnectAttempts}/${maxAttempts})...`);
      } else {
        console.error(`Network error: ${error.message}`);
        console.error(`Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${reconnectAttempts}/${maxAttempts})...`);
      }

      await sleep(delay);
    }
  }
}

// ---------------------------------------------------------------------------
// Recovery stream — replay missed data for a time window (Enterprise)
// ---------------------------------------------------------------------------

/**
 * Connect to a recovery stream to replay missed Posts from a time window.
 *
 * @param {Function} onPost - Callback invoked with each Post object
 * @param {string} startTime - ISO 8601 UTC start time
 * @param {string} endTime - ISO 8601 UTC end time
 * @param {Object} [options] - Override stream options
 */
export async function connectToRecoveryStream(onPost, startTime, endTime, options = {}) {
  const deduplicator = new Deduplicator();
  let postCount = 0;

  const params = buildStreamParams(options);
  params.start_time = startTime;
  params.end_time = endTime;

  console.log(`Starting recovery stream: ${startTime} → ${endTime}`);

  const response = await client.stream(STREAM_ENDPOINT, params);
  console.log("Recovery stream connected. Replaying Posts...\n");

  const queue = new PostQueue();
  queue.setHandler(async (data) => {
    const postId = data?.data?.id;
    if (postId && deduplicator.isDuplicate(postId)) return;
    postCount++;
    await onPost(data);
  });

  try {
    await processStream(response, queue);
  } catch {
    // Recovery stream ends when replay is complete (server closes connection)
  }

  console.log(`\nRecovery complete. ${postCount} posts replayed (${deduplicator.duplicateCount} duplicates filtered).`);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildStreamParams(options) {
  const params = {
    "tweet.fields": options.tweetFields || config.stream.tweetFields,
    expansions: options.expansions || config.stream.expansions,
    "user.fields": options.userFields || config.stream.userFields,
  };

  if (config.stream.backfillMinutes > 0) {
    params.backfill_minutes = config.stream.backfillMinutes;
  }

  return params;
}

/**
 * Read from the streaming response body line by line.
 * Pushes parsed objects into the FIFO queue for async processing.
 */
async function processStream(response, postQueue) {
  const decoder = new TextDecoder();
  let buffer = "";
  let lastDataTime = Date.now();
  let heartbeatFailed = false;

  // Heartbeat monitor: if no data or keep-alive for 20s, trigger reconnect
  const heartbeatInterval = setInterval(() => {
    if (Date.now() - lastDataTime > 20000) {
      heartbeatFailed = true;
      clearInterval(heartbeatInterval);
    }
  }, 5000);

  try {
    for await (const chunk of response.body) {
      if (heartbeatFailed) {
        throw new Error("Heartbeat timeout — no data received for 20s");
      }

      lastDataTime = Date.now();
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue; // keep-alive signal

        try {
          const data = JSON.parse(line);

          // Handle in-stream error messages (operational disconnect, etc.)
          if (data.errors) {
            for (const err of data.errors) {
              console.error(`Stream error: ${err.title} — ${err.detail || err.disconnect_type || ""}`);
            }
            continue;
          }

          postQueue.push(data);
        } catch (parseError) {
          console.error("Failed to parse stream data:", parseError.message);
        }
      }
    }
  } finally {
    clearInterval(heartbeatInterval);
  }

  throw new Error("Stream connection closed by server");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
