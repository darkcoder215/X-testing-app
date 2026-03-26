import client from "../lib/client.js";
import config from "../lib/config.js";

const STREAM_ENDPOINT = config.api.streamEndpoint;

/**
 * Connect to the Filtered Stream and process incoming Posts.
 *
 * Handles:
 * - Keep-alive signals (blank lines every ~20s)
 * - Automatic reconnection with exponential backoff
 * - Graceful shutdown on SIGINT/SIGTERM
 *
 * @param {Function} onPost - Callback invoked with each Post object
 * @param {Object} [options] - Override stream options
 */
export async function connectToStream(onPost, options = {}) {
  const { maxAttempts, initialDelayMs } = config.reconnect;
  let reconnectAttempts = 0;
  let currentDelay = initialDelayMs;
  let isShuttingDown = false;

  const shutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log("\nDisconnecting from stream...");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const params = {
    "tweet.fields": options.tweetFields || config.stream.tweetFields,
    expansions: options.expansions || config.stream.expansions,
    "user.fields": options.userFields || config.stream.userFields,
  };

  if (config.stream.backfillMinutes > 0) {
    params.backfill_minutes = config.stream.backfillMinutes;
  }

  while (!isShuttingDown) {
    try {
      console.log("Connecting to Filtered Stream...");
      const response = await client.stream(STREAM_ENDPOINT, params);

      // Reset reconnect state on successful connection
      reconnectAttempts = 0;
      currentDelay = initialDelayMs;
      console.log("Connected. Waiting for Posts...\n");

      await processStream(response, onPost);
    } catch (error) {
      if (isShuttingDown) break;

      reconnectAttempts++;

      if (reconnectAttempts > maxAttempts) {
        console.error(`Max reconnection attempts (${maxAttempts}) reached. Exiting.`);
        process.exit(1);
      }

      // Rate limit: back off longer
      if (error.status === 429) {
        currentDelay = Math.max(currentDelay, 60000);
        console.error(`Rate limited. Waiting ${currentDelay / 1000}s before retry...`);
      } else {
        console.error(`Stream error: ${error.message}`);
        console.error(`Reconnecting in ${currentDelay / 1000}s (attempt ${reconnectAttempts}/${maxAttempts})...`);
      }

      await sleep(currentDelay);
      // Exponential backoff capped at 5 minutes
      currentDelay = Math.min(currentDelay * 2, 300000);
    }
  }
}

/**
 * Read from the streaming response body line by line.
 */
async function processStream(response, onPost) {
  const decoder = new TextDecoder();
  let buffer = "";
  let lastDataTime = Date.now();

  // Heartbeat monitor: if no data or keep-alive for 30s, throw to reconnect
  const heartbeatInterval = setInterval(() => {
    if (Date.now() - lastDataTime > 30000) {
      clearInterval(heartbeatInterval);
      throw new Error("Heartbeat timeout - no data received for 30s");
    }
  }, 5000);

  try {
    for await (const chunk of response.body) {
      lastDataTime = Date.now();
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split("\r\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) {
          // Keep-alive signal — ignore
          continue;
        }

        try {
          const data = JSON.parse(line);
          onPost(data);
        } catch (parseError) {
          console.error("Failed to parse stream data:", parseError.message);
        }
      }
    }
  } finally {
    clearInterval(heartbeatInterval);
  }

  // If we get here, the stream ended (server closed connection)
  throw new Error("Stream connection closed by server");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
