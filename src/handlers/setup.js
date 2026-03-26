import { readFile, writeFile, access } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "../../.env");
const ENV_EXAMPLE_PATH = join(__dirname, "../../.env.example");

/**
 * Interactive setup wizard that configures the .env file with X API credentials.
 * Validates the Bearer Token by making a test API call.
 */
export async function runSetup() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

  console.log(`
  ┌─────────────────────────────────────────┐
  │     X Filtered Stream — Setup Wizard    │
  └─────────────────────────────────────────┘
  `);

  console.log("  This will configure your .env file with the credentials");
  console.log("  needed to connect to the X API Filtered Stream.\n");
  console.log("  Prerequisites:");
  console.log("    1. An approved X Developer Account");
  console.log("       https://developer.x.com/en/portal/petition/essential/basic-info");
  console.log("    2. A Project and App in the Developer Portal");
  console.log("       https://developer.x.com/en/portal/dashboard");
  console.log("    3. A Bearer Token from your App's \"Keys and Tokens\" page\n");

  // Check for existing .env
  let existingEnv = "";
  try {
    await access(ENV_PATH);
    existingEnv = await readFile(ENV_PATH, "utf-8");
    const hasBearerToken = /^X_BEARER_TOKEN=.+/m.test(existingEnv);
    if (hasBearerToken) {
      const overwrite = await ask("  A .env file with a Bearer Token already exists. Overwrite? (y/N): ");
      if (overwrite.toLowerCase() !== "y") {
        console.log("  Setup cancelled.");
        rl.close();
        return;
      }
    }
  } catch {
    // No existing .env — we'll create one from .env.example
  }

  // Get Bearer Token
  console.log("");
  const bearerToken = await ask("  Enter your X API Bearer Token: ");

  if (!bearerToken.trim()) {
    console.error("\n  Error: Bearer Token cannot be empty.");
    rl.close();
    process.exit(1);
  }

  // Validate the token with a test API call
  console.log("\n  Validating Bearer Token...");
  const isValid = await validateBearerToken(bearerToken.trim());

  if (!isValid) {
    console.error("  Token validation failed. Please check your Bearer Token.");
    const proceed = await ask("  Save anyway? (y/N): ");
    if (proceed.toLowerCase() !== "y") {
      console.log("  Setup cancelled.");
      rl.close();
      return;
    }
  } else {
    console.log("  Bearer Token is valid!\n");
  }

  // Ask for optional stream config
  const configureAdvanced = await ask("  Configure advanced stream settings? (y/N): ");

  let backfillMinutes = "0";
  let tweetFields = "";
  let expansions = "";
  let userFields = "";

  if (configureAdvanced.toLowerCase() === "y") {
    console.log("\n  Leave blank to use defaults.\n");

    backfillMinutes = await ask("  Backfill minutes (0-5, Enterprise only) [0]: ") || "0";

    tweetFields = await ask(
      "  Tweet fields [author_id,created_at,lang,public_metrics,entities,source]: "
    );

    expansions = await ask("  Expansions [author_id]: ");

    userFields = await ask(
      "  User fields [name,username,profile_image_url,verified,verified_type]: "
    );
  }

  // Build .env content
  let envContent;
  try {
    envContent = await readFile(ENV_EXAMPLE_PATH, "utf-8");
  } catch {
    envContent = generateEnvTemplate();
  }

  // Replace values in the template
  envContent = envContent.replace(
    /^X_BEARER_TOKEN=.*/m,
    `X_BEARER_TOKEN=${bearerToken.trim()}`
  );

  if (backfillMinutes !== "0") {
    envContent = envContent.replace(
      /^STREAM_BACKFILL_MINUTES=.*/m,
      `STREAM_BACKFILL_MINUTES=${backfillMinutes}`
    );
  }

  if (tweetFields) {
    envContent = envContent.replace(
      /^STREAM_TWEET_FIELDS=.*/m,
      `STREAM_TWEET_FIELDS=${tweetFields}`
    );
  }

  if (expansions) {
    envContent = envContent.replace(
      /^STREAM_EXPANSIONS=.*/m,
      `STREAM_EXPANSIONS=${expansions}`
    );
  }

  if (userFields) {
    envContent = envContent.replace(
      /^STREAM_USER_FIELDS=.*/m,
      `STREAM_USER_FIELDS=${userFields}`
    );
  }

  await writeFile(ENV_PATH, envContent, "utf-8");
  console.log("\n  .env file saved successfully!");

  // Show next steps
  console.log(`
  ┌─────────────────────────────────────────┐
  │          Setup Complete!                │
  └─────────────────────────────────────────┘

  Next steps:

    1. Add filter rules:
       node src/index.js rules add "#AI lang:en -is:retweet" --tag="AI"

    2. Or load example rules:
       node src/index.js rules add-file examples/rules.json

    3. Start streaming:
       node src/index.js stream
  `);

  rl.close();
}

async function validateBearerToken(token) {
  try {
    const response = await fetch(
      "https://api.x.com/2/tweets/search/stream/rules",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "x-filtered-stream/1.0.0",
        },
      }
    );
    // 200 or 200 with empty rules both mean the token works
    return response.ok;
  } catch (error) {
    console.error(`  Network error during validation: ${error.message}`);
    return false;
  }
}

function generateEnvTemplate() {
  return `# X API Credentials
X_BEARER_TOKEN=your_bearer_token_here

# Stream Configuration
STREAM_BACKFILL_MINUTES=0
STREAM_TWEET_FIELDS=author_id,created_at,lang,public_metrics,entities,source
STREAM_EXPANSIONS=author_id
STREAM_USER_FIELDS=name,username,profile_image_url,verified,verified_type

# Reconnect settings
MAX_RECONNECT_ATTEMPTS=10
`;
}
