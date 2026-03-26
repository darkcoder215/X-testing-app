import dotenv from "dotenv";
dotenv.config();

const config = {
  bearerToken: process.env.X_BEARER_TOKEN,

  api: {
    baseUrl: "https://api.x.com/2",
    streamEndpoint: "/tweets/search/stream",
    rulesEndpoint: "/tweets/search/stream/rules",
    searchEndpoint: "/tweets/search/recent",
  },

  stream: {
    backfillMinutes: parseInt(process.env.STREAM_BACKFILL_MINUTES || "0", 10),
    tweetFields: process.env.STREAM_TWEET_FIELDS || "author_id,created_at,lang,public_metrics,entities,source",
    expansions: process.env.STREAM_EXPANSIONS || "author_id",
    userFields: process.env.STREAM_USER_FIELDS || "name,username,profile_image_url,verified,verified_type",
  },

  reconnect: {
    maxAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || "10", 10),
    // TCP/IP errors: linear backoff starting at 250ms, cap 16s
    tcpInitialDelayMs: 250,
    tcpMaxDelayMs: 16000,
    // HTTP errors: exponential backoff starting at 5s, cap 320s
    httpInitialDelayMs: 5000,
    httpMaxDelayMs: 320000,
    // Rate limit (429): exponential backoff starting at 60s
    rateLimitInitialDelayMs: 60000,
  },

  volume: {
    trackingIntervalMs: parseInt(process.env.VOLUME_TRACKING_INTERVAL_MS || "60000", 10),
    alertThresholdPercent: parseInt(process.env.VOLUME_ALERT_THRESHOLD_PERCENT || "50", 10),
  },
};

export function validateConfig() {
  if (!config.bearerToken) {
    console.error("Error: X_BEARER_TOKEN is not set.");
    console.error('Run "node src/index.js setup" to configure, or:');
    console.error("Copy .env.example to .env and add your Bearer Token.");
    console.error("Get one at: https://developer.x.com/en/portal/dashboard");
    process.exit(1);
  }
  return config;
}

/** Reload the bearer token from the current .env (after setup writes it). */
export function reloadBearerToken() {
  dotenv.config({ override: true });
  config.bearerToken = process.env.X_BEARER_TOKEN;
}

export default config;
