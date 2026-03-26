/**
 * Format and display streamed Posts in the terminal.
 */

/**
 * Default post handler — pretty-prints Posts to stdout.
 * @param {Object} data - Streamed post data from the API
 */
export function formatPost(data) {
  const post = data.data;
  if (!post) return;

  const user = findUser(data, post.author_id);
  const matchingRules = data.matching_rules || [];

  const timestamp = post.created_at
    ? new Date(post.created_at).toLocaleString()
    : "unknown";

  console.log("━".repeat(72));

  if (user) {
    const verified = user.verified_type ? ` [${user.verified_type}]` : "";
    console.log(`  @${user.username} (${user.name})${verified}`);
  }

  console.log(`  ${timestamp}  |  ID: ${post.id}`);

  if (post.lang) {
    console.log(`  Language: ${post.lang}`);
  }

  if (post.source) {
    console.log(`  Source: ${post.source}`);
  }

  console.log("");
  console.log(`  ${post.text}`);

  if (post.public_metrics) {
    const m = post.public_metrics;
    console.log("");
    console.log(
      `  ♥ ${m.like_count}  ↻ ${m.retweet_count}  💬 ${m.reply_count}  👁 ${m.impression_count || 0}`
    );
  }

  if (post.entities?.hashtags?.length > 0) {
    const tags = post.entities.hashtags.map((h) => `#${h.tag}`).join(" ");
    console.log(`  Tags: ${tags}`);
  }

  if (post.entities?.urls?.length > 0) {
    for (const url of post.entities.urls) {
      console.log(`  🔗 ${url.expanded_url || url.url}`);
    }
  }

  if (matchingRules.length > 0) {
    const ruleLabels = matchingRules
      .map((r) => r.tag || r.id)
      .join(", ");
    console.log(`\n  Matched rules: ${ruleLabels}`);
  }

  if (post.edit_history_tweet_ids?.length > 1) {
    console.log(`  Edit history: ${post.edit_history_tweet_ids.join(" → ")}`);
  }

  console.log("");
}

/**
 * Compact single-line format for high-volume streams.
 */
export function formatPostCompact(data) {
  const post = data.data;
  if (!post) return;

  const user = findUser(data, post.author_id);
  const handle = user ? `@${user.username}` : post.author_id;
  const text = post.text.replace(/\n/g, " ").substring(0, 120);
  const time = post.created_at
    ? new Date(post.created_at).toLocaleTimeString()
    : "";

  console.log(`[${time}] ${handle}: ${text}`);
}

/**
 * JSON output — useful for piping to other tools.
 */
export function formatPostJSON(data) {
  console.log(JSON.stringify(data));
}

function findUser(data, authorId) {
  if (!data.includes?.users) return null;
  return data.includes.users.find((u) => u.id === authorId) || null;
}
