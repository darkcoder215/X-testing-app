#!/usr/bin/env node

import { validateConfig } from "./lib/config.js";
import { getRules, addRules, deleteRules, deleteAllRules, printRules } from "./handlers/rules.js";
import { connectToStream } from "./handlers/stream.js";
import { formatPost, formatPostCompact, formatPostJSON } from "./handlers/formatter.js";

const HELP_TEXT = `
  X Filtered Stream CLI
  =====================

  Usage: node src/index.js <command> [options]

  Commands:

    stream [--format=default|compact|json]
        Connect to the Filtered Stream and display matching Posts.

    rules list
        List all active stream rules.

    rules add <value> [--tag=<tag>]
        Add a new rule. The value is the filter expression.
        Example: node src/index.js rules add "from:elonmusk -is:retweet" --tag="Elon"

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
    Copy .env.example to .env and set your X_BEARER_TOKEN.
    Get a Bearer Token at: https://developer.x.com/en/portal/dashboard

  Examples:
    # Add rules and start streaming
    node src/index.js rules add "#AI lang:en -is:retweet" --tag="AI English"
    node src/index.js rules add "from:elonmusk" --tag="Elon"
    node src/index.js stream

    # Compact output for high-volume streams
    node src/index.js stream --format=compact

    # JSON output for piping
    node src/index.js stream --format=json | jq '.data.text'
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help" || command === "--help") {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Validate config before any API calls
  validateConfig();

  switch (command) {
    case "stream":
      await handleStream(args.slice(1));
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

async function handleStream(args) {
  const formatFlag = args.find((a) => a.startsWith("--format="));
  const format = formatFlag ? formatFlag.split("=")[1] : "default";

  let formatter;
  switch (format) {
    case "compact":
      formatter = formatPostCompact;
      break;
    case "json":
      formatter = formatPostJSON;
      break;
    case "default":
      formatter = formatPost;
      break;
    default:
      console.error(`Unknown format: ${format}. Use default, compact, or json.`);
      process.exit(1);
  }

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
