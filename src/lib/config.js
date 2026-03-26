import dotenv from "dotenv";
dotenv.config();

const config = {
  bearerToken: process.env.X_BEARER_TOKEN,

  api: {
    baseUrl: "https://api.x.com/2",
    streamEndpoint: "/tweets/search/stream",
    rulesEndpoint: "/tweets/search/stream/rules",
  },

  stream: {
    backfillMinutes: parseInt(process.env.STREAM_BACKFILL_MINUTES || "0", 10),
    tweetFields: process.env.STREAM_TWEET_FIELDS || "author_id,created_at,lang,public_metrics,entities,source",
    expansions: process.env.STREAM_EXPANSIONS || "author_id",
    userFields: process.env.STREAM_USER_FIELDS || "name,username,profile_image_url,verified,verified_type",
  },

  reconnect: {
    maxAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || "10", 10),
    initialDelayMs: parseInt(process.env.INITIAL_RECONNECT_DELAY_MS || "1000", 10),
  },
};

export function validateConfig() {
  if (!config.bearerToken) {
    console.error("Error: X_BEARER_TOKEN is not set.");
    console.error("Copy .env.example to .env and add your Bearer Token.");
    console.error("Get one at: https://developer.x.com/en/portal/dashboard");
    process.exit(1);
  }
  return config;
}

export default config;
