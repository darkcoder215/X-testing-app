#!/usr/bin/env node

import { validateConfig } from "./lib/config.js";
import { getRules, addRules, deleteRules, deleteAllRules, printRules } from "./handlers/rules.js";
import { connectToStream, connectToRecoveryStream } from "./handlers/stream.js";
import { formatPost, formatPostCompact, formatPostJSON } from "./handlers/formatter.js";
import { runSetup } from "./handlers/setup.js";

const HELP_TEXT = `
  X Filtered Stream CLI
  =====================

  Usage: node src/index.js <command> [options]

  Commands:

    setup
        Interactive setup wizard — configure your Bearer Token and
        stream settings. Creates/updates the .env file.

    stream [--format=default|compact|json]
        Connect to the Filtered Stream and display matching Posts.
        Uses a FIFO queue for async processing, auto-reconnects with
        per-error-type backoff, tracks volume, and deduplicates Posts.

    recover --start=<ISO8601> --end=<ISO8601> [--format=default|compact|json]
        Replay missed Posts from a time window (up to 24h, Enterprise).
        Example: recover --start=2024-01-15T10:00:00Z --end=2024-01-15T10:10:00Z

    rules list
        List all active stream rules.

    rules add <value> [--tag=<tag>]
        Add a new rule. The value is the filter expression.
        Example: rules add "from:elonmusk -is:retweet" --tag="Elon"

    rules add-file <path>
        Add rules from a JSON file. The file should contain an array of
        { "value": "...", "tag": "..." } objects.

    rules delete <id1> [id2] [id3...]
        Delete rules by their IDs.

    rules delete-all
        Delete all active rules.

    help
        Show this help message.

  Environment:
    Run "node src/index.js setup" to configure interactively, or
    copy .env.example to .env and set your X_BEARER_TOKEN manually.

  Reconnection Strategy:
    TCP/IP errors  → linear backoff (+250ms per attempt, max 16s)
    HTTP errors    → exponential backoff (5s → 10s → 20s..., max 320s)
    Rate limit 429 → exponential backoff (60s → 120s → 240s...)

  Examples:
    # First-time setup
    node src/index.js setup

    # Add rules and start streaming
    node src/index.js rules add "#AI lang:en -is:retweet" --tag="AI English"
    node src/index.js rules add "from:elonmusk" --tag="Elon"
    node src/index.js stream

    # Load example rules
    node src/index.js rules add-file examples/rules.json

    # Compact output for high-volume streams
    node src/index.js stream --format=compact

    # JSON output for piping
    node src/index.js stream --format=json | jq '.data.text'

    # Recover missed Posts (Enterprise)
    node src/index.js recover --start=2024-01-15T10:00:00Z --end=2024-01-15T10:10:00Z
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Setup doesn't need a valid token yet
  if (command === "setup") {
    await runSetup();
    return;
  }

  // Validate config before any API calls
  validateConfig();

  switch (command) {
    case "stream":
      await handleStream(args.slice(1));
      break;
    case "recover":
      await handleRecover(args.slice(1));
      break;
    case "rules":
      await handleRules(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "node src/index.js help" for usage.');
      process.exit(1);
  }
}

function getFormatter(args) {
  const formatFlag = args.find((a) => a.startsWith("--format="));
  const format = formatFlag ? formatFlag.split("=")[1] : "default";

  switch (format) {
    case "compact":
      return formatPostCompact;
    case "json":
      return formatPostJSON;
    case "default":
      return formatPost;
    default:
      console.error(`Unknown format: ${format}. Use default, compact, or json.`);
      process.exit(1);
  }
}

async function handleStream(args) {
  const formatter = getFormatter(args);

  // Show current rules before connecting
  const rules = await getRules();
  if (rules.length === 0) {
    console.log("Warning: No rules are set. Add rules first to receive Posts.");
    console.log('Example: node src/index.js rules add "#tech lang:en" --tag="Tech"\n');
  } else {
    printRules(rules);
    console.log("");
  }

  await connectToStream(formatter);
}

async function handleRecover(args) {
  const startFlag = args.find((a) => a.startsWith("--start="));
  const endFlag = args.find((a) => a.startsWith("--end="));

  if (!startFlag || !endFlag) {
    console.error("Error: Both --start and --end are required for recovery.");
    console.error("Usage: recover --start=<ISO8601> --end=<ISO8601> [--format=...]");
    console.error("Example: recover --start=2024-01-15T10:00:00Z --end=2024-01-15T10:10:00Z");
    process.exit(1);
  }

  const startTime = startFlag.split("=").slice(1).join("=");
  const endTime = endFlag.split("=").slice(1).join("=");

  // Validate ISO 8601 format
  if (isNaN(Date.parse(startTime)) || isNaN(Date.parse(endTime))) {
    console.error("Error: start and end must be valid ISO 8601 dates.");
    console.error("Example: 2024-01-15T10:00:00Z");
    process.exit(1);
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    console.error("Error: end time must be after start time.");
    process.exit(1);
  }

  const hoursDiff = (end - start) / (1000 * 60 * 60);
  if (hoursDiff > 24) {
    console.error("Error: Recovery window cannot exceed 24 hours.");
    console.error("For longer gaps, use the Search Posts endpoint instead.");
    process.exit(1);
  }

  const formatter = getFormatter(args);
  await connectToRecoveryStream(formatter, startTime, endTime);
}

async function handleRules(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case "list": {
      const rules = await getRules();
      printRules(rules);
      break;
    }

    case "add": {
      const value = args[1];
      if (!value) {
        console.error("Error: Rule value is required.");
        console.error('Usage: rules add "<filter expression>" [--tag=<tag>]');
        process.exit(1);
      }

      const tagFlag = args.find((a) => a.startsWith("--tag="));
      const tag = tagFlag ? tagFlag.split("=").slice(1).join("=") : undefined;

      const rule = { value };
      if (tag) rule.tag = tag;

      const result = await addRules([rule]);
      console.log("Rule added successfully.");
      if (result.meta) {
        console.log(`  Created: ${result.meta.summary.created}`);
        console.log(`  Not created: ${result.meta.summary.not_created}`);
      }
      break;
    }

    case "add-file": {
      const filePath = args[1];
      if (!filePath) {
        console.error("Error: File path is required.");
        process.exit(1);
      }

      const { readFile } = await import("node:fs/promises");
      const content = await readFile(filePath, "utf-8");
      const rules = JSON.parse(content);

      if (!Array.isArray(rules)) {
        console.error("Error: File must contain a JSON array of rules.");
        process.exit(1);
      }

      const result = await addRules(rules);
      console.log("Rules added from file.");
      if (result.meta) {
        console.log(`  Created: ${result.meta.summary.created}`);
        console.log(`  Not created: ${result.meta.summary.not_created}`);
      }
      break;
    }

    case "delete": {
      const ids = args.slice(1);
      if (ids.length === 0) {
        console.error("Error: At least one rule ID is required.");
        process.exit(1);
      }

      await deleteRules(ids);
      console.log(`Deleted ${ids.length} rule(s).`);
      break;
    }

    case "delete-all": {
      await deleteAllRules();
      console.log("All rules deleted.");
      break;
    }

    default:
      console.error(`Unknown rules subcommand: ${subcommand}`);
      console.error("Available: list, add, add-file, delete, delete-all");
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
