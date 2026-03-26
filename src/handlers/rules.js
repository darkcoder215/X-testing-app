import client from "../lib/client.js";
import config from "../lib/config.js";

const RULES_ENDPOINT = config.api.rulesEndpoint;

/**
 * List all current stream rules.
 */
export async function getRules() {
  const response = await client.get(RULES_ENDPOINT);
  return response.data || [];
}

/**
 * Add one or more rules to the stream.
 * @param {Array<{value: string, tag?: string}>} rules - Rules to add
 * @returns {Object} API response with created rules and metadata
 *
 * Example:
 *   addRules([
 *     { value: '#javascript lang:en -is:retweet', tag: 'JS tweets' },
 *     { value: 'from:elonmusk', tag: 'Elon tweets' }
 *   ])
 */
export async function addRules(rules) {
  if (!rules || rules.length === 0) {
    throw new Error("At least one rule is required.");
  }

  const body = { add: rules };
  const response = await client.post(RULES_ENDPOINT, body);

  if (response.errors) {
    const errorMessages = response.errors.map((e) => `  - ${e.title}: ${e.value}`).join("\n");
    throw new Error(`Rule creation errors:\n${errorMessages}`);
  }

  return response;
}

/**
 * Delete rules by their IDs.
 * @param {string[]} ids - Rule IDs to delete
 */
export async function deleteRules(ids) {
  if (!ids || ids.length === 0) {
    throw new Error("At least one rule ID is required.");
  }

  const body = { delete: { ids } };
  return client.post(RULES_ENDPOINT, body);
}

/**
 * Delete all existing rules.
 */
export async function deleteAllRules() {
  const rules = await getRules();

  if (rules.length === 0) {
    return { message: "No rules to delete." };
  }

  const ids = rules.map((rule) => rule.id);
  return deleteRules(ids);
}

/**
 * Replace all rules with a new set (delete existing, then add new).
 * @param {Array<{value: string, tag?: string}>} rules - New rules
 */
export async function replaceRules(rules) {
  await deleteAllRules();
  return addRules(rules);
}

/**
 * Pretty-print rules to the console.
 */
export function printRules(rules) {
  if (!rules || rules.length === 0) {
    console.log("No active rules.");
    return;
  }

  console.log(`\n  Active Rules (${rules.length}):`);
  console.log("  " + "-".repeat(70));

  for (const rule of rules) {
    console.log(`  ID:    ${rule.id}`);
    console.log(`  Value: ${rule.value}`);
    if (rule.tag) {
      console.log(`  Tag:   ${rule.tag}`);
    }
    console.log("  " + "-".repeat(70));
  }
}
