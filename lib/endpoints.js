/**
 * X API v2 Endpoint Registry
 *
 * A catalog of all supported X API v2 endpoints with:
 * - Human-readable descriptions and explanations
 * - Parameter definitions with types and descriptions
 * - URL templates with path parameter substitution
 * - Expected response shapes
 * - Rate limit info and access level requirements
 *
 * WHY: This registry powers the Explore page. It lets users
 * browse endpoints, understand what they do, fill in parameters,
 * and send test requests — all from the browser. It's also used
 * by the /api/x proxy route to validate and route requests.
 */

const ENDPOINTS = {
  // =========================================================================
  // POSTS — Look up, search, and explore Posts
  // =========================================================================

  "post-lookup": {
    name: "Post Lookup",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id",
    description: "Look up a single Post by its ID",
    explanation:
      "Retrieves a single Post (tweet) by its ID. Returns the Post text, author, metrics, entities (hashtags, URLs, mentions), and more depending on the fields you request. This is the most basic way to fetch a Post when you already know its ID.",
    whenToUse:
      "When you have a Post ID (e.g., from a URL like x.com/user/status/1234567890) and want to see its full content and metadata.",
    whatToExpect:
      "Returns a single Post object in `data`. If you include expansions, related objects (author, media, etc.) appear in `includes`. The Post ID from a URL is the number after /status/.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The Post ID (numeric string from the URL)",
        placeholder: "1234567890123456789",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        description: "Additional Post fields to return",
        default: "author_id,created_at,public_metrics,entities,lang,source,conversation_id",
        options: "attachments,author_id,context_annotations,conversation_id,created_at,edit_controls,entities,geo,id,in_reply_to_user_id,lang,possibly_sensitive,public_metrics,referenced_tweets,reply_settings,source,text,withheld",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        description: "Expand related objects (e.g., author details)",
        default: "author_id",
        options: "attachments.poll_ids,attachments.media_keys,author_id,edit_history_tweet_ids,entities.mentions.username,geo.place_id,in_reply_to_user_id,referenced_tweets.id,referenced_tweets.id.author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        description: "User fields when expanding author_id",
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "media.fields",
        type: "query",
        required: false,
        description: "Media fields when expanding attachments",
        default: "url,preview_image_url,type,width,height",
      },
    ],
    rateLimit: "300 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "post-lookup-multiple": {
    name: "Multiple Post Lookup",
    category: "Posts",
    method: "GET",
    path: "/2/tweets",
    description: "Look up multiple Posts by their IDs (up to 100)",
    explanation:
      "Retrieves up to 100 Posts in a single request. More efficient than making individual requests when you need multiple Posts. Returns them in the same order as the IDs provided.",
    whenToUse:
      "When you have a list of Post IDs and want to fetch them all at once. Much faster than calling post-lookup 100 times.",
    whatToExpect:
      "Returns an array of Post objects in `data`. Posts that don't exist or are deleted won't appear in the response (no error, just absent). Check `errors` array for details on any Posts that couldn't be returned.",
    params: [
      {
        name: "ids",
        type: "query",
        required: true,
        description: "Comma-separated Post IDs (up to 100)",
        placeholder: "1234567890,9876543210",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "author_id,created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "300 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "search-recent": {
    name: "Search Recent Posts",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/search/recent",
    description: "Search Posts from the last 7 days",
    explanation:
      "Searches for Posts published in the last 7 days matching a query. Uses the same operators as Filtered Stream rules (keywords, hashtags, from:, lang:, etc.). Returns newest Posts first by default. Supports pagination for large result sets.",
    whenToUse:
      "When you want to find Posts about a topic, from a user, or matching specific criteria within the past week. Great for research, monitoring, and analysis.",
    whatToExpect:
      "Returns an array of matching Posts in `data`, plus a `meta` object with result_count and next_token for pagination. The `next_token` can be passed as `pagination_token` to get the next page of results.",
    params: [
      {
        name: "query",
        type: "query",
        required: true,
        description: "Search query using X operators (same syntax as stream rules)",
        placeholder: '#AI lang:en -is:retweet',
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "Number of results per page (10-100)",
        default: "10",
        placeholder: "10",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "author_id,created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
      {
        name: "sort_order",
        type: "query",
        required: false,
        description: "Order of results: 'recency' (newest first) or 'relevancy'",
        default: "recency",
      },
      {
        name: "pagination_token",
        type: "query",
        required: false,
        description: "Token from previous response's meta.next_token for pagination",
        placeholder: "",
      },
    ],
    rateLimit: "450 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "tweet-counts": {
    name: "Post Counts (Recent)",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/counts/recent",
    description: "Get the count of Posts matching a query (last 7 days)",
    explanation:
      "Returns the number of Posts matching a query, broken down by time granularity (minute, hour, or day). Does NOT return the Posts themselves — just the counts. Useful for measuring volume before doing a full search.",
    whenToUse:
      "When you want to know HOW MANY Posts match a query without actually retrieving them. Good for volume estimation, trend analysis, and deciding whether to refine your query.",
    whatToExpect:
      "Returns a `data` array of time-bucketed counts (e.g., [{start, end, tweet_count}]) and a `meta.total_tweet_count` with the grand total. No Post content is returned.",
    params: [
      {
        name: "query",
        type: "query",
        required: true,
        description: "Search query (same syntax as search)",
        placeholder: "#AI lang:en",
      },
      {
        name: "granularity",
        type: "query",
        required: false,
        description: "Time bucket size: 'minute', 'hour', or 'day'",
        default: "hour",
      },
    ],
    rateLimit: "300 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "quote-tweets": {
    name: "Quote Tweets",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/quote_tweets",
    description: "Get Posts that quote a specific Post",
    explanation:
      "Returns Posts that quote (retweet with comment) a specific Post. This lets you see the conversation around a viral Post — how people are reacting, adding context, or disagreeing.",
    whenToUse:
      "When you want to see how people are discussing or reacting to a specific Post through quote tweets.",
    whatToExpect:
      "Returns an array of Posts that quote the specified Post. Each returned Post will have `referenced_tweets` containing a reference to the original Post with type 'quoted'.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The Post ID to get quote tweets for",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        default: "10",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "author_id,created_at,public_metrics,entities",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "75 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "liking-users": {
    name: "Liking Users",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/liking_users",
    description: "Get users who liked a specific Post",
    explanation:
      "Returns a list of users who have liked (hearted) a specific Post. Useful for understanding engagement and who your audience is.",
    whenToUse: "When you want to see who liked a specific Post.",
    whatToExpect:
      "Returns an array of User objects in `data`. Note: this may not return ALL users due to privacy settings. The `meta.result_count` tells you how many were returned.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The Post ID",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        default: "10",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "75 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "retweeted-by": {
    name: "Retweeted By",
    category: "Posts",
    method: "GET",
    path: "/2/tweets/:id/retweeted_by",
    description: "Get users who retweeted a specific Post",
    explanation:
      "Returns a list of users who retweeted (not quote-tweeted) a specific Post. Retweets are the simplest form of sharing — just amplifying the original Post without adding commentary.",
    whenToUse: "When you want to see who retweeted/shared a specific Post.",
    whatToExpect:
      "Returns an array of User objects. Similar to liking_users but for retweets.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The Post ID",
        placeholder: "1234567890123456789",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        default: "10",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics",
      },
    ],
    rateLimit: "75 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  // =========================================================================
  // USERS — Look up users and their activity
  // =========================================================================

  "user-by-username": {
    name: "User Lookup by Username",
    category: "Users",
    method: "GET",
    path: "/2/users/by/username/:username",
    description: "Look up a user by their @username",
    explanation:
      "Retrieves a user's profile by their username (the @handle). Returns their name, bio, profile image, follower/following counts, verification status, and more. This is the easiest way to look up a user when you know their handle.",
    whenToUse:
      "When you know someone's @username and want to get their profile info, user ID (needed for other endpoints), or public metrics.",
    whatToExpect:
      "Returns a single User object in `data` with the fields you requested. The `id` field is the user's numeric ID which you'll need for timeline, followers, and other user-specific endpoints.",
    params: [
      {
        name: "username",
        type: "path",
        required: true,
        description: "The user's @handle (without the @ symbol)",
        placeholder: "elonmusk",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        description: "Additional user fields to return",
        default: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        description: "Expand related objects",
        default: "pinned_tweet_id",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        description: "Tweet fields for expanded pinned tweet",
        default: "created_at,public_metrics,text",
      },
    ],
    rateLimit: "300 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "user-by-id": {
    name: "User Lookup by ID",
    category: "Users",
    method: "GET",
    path: "/2/users/:id",
    description: "Look up a user by their numeric ID",
    explanation:
      "Same as username lookup but uses the numeric user ID instead. User IDs are stable (usernames can change), so this is more reliable for long-term tracking.",
    whenToUse:
      "When you have a user's numeric ID (e.g., from a Post's author_id field) and want their profile details.",
    whatToExpect: "Same response as username lookup — a single User object in `data`.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The user's numeric ID",
        placeholder: "44196397",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,verified_type",
      },
    ],
    rateLimit: "300 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "user-tweets": {
    name: "User Timeline",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/tweets",
    description: "Get a user's recent Posts (timeline)",
    explanation:
      "Retrieves the most recent Posts from a specific user's timeline. This includes their original Posts, retweets, replies, and quote tweets. You can use exclude parameters to filter these.",
    whenToUse:
      "When you want to see what a user has been posting recently. First look up the user by username to get their ID, then use this endpoint.",
    whatToExpect:
      "Returns an array of Post objects in `data` (newest first by default). Includes pagination via `meta.next_token`. Note: you need the user's numeric ID, not their username.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The user's numeric ID (get it from user lookup)",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "Number of Posts to return (5-100)",
        default: "10",
      },
      {
        name: "exclude",
        type: "query",
        required: false,
        description: "Exclude retweets and/or replies",
        default: "retweets",
        options: "retweets,replies",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "created_at,public_metrics,entities,lang,source",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "1500 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "user-mentions": {
    name: "User Mentions",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/mentions",
    description: "Get Posts that mention a specific user",
    explanation:
      "Retrieves Posts where other users have @mentioned the specified user. This is how you track what people are saying about/to a specific account.",
    whenToUse:
      "When you want to see what other people are saying about or to a specific user.",
    whatToExpect:
      "Returns an array of Posts that contain @mentions of the user. These are Posts by OTHER users, not by the specified user.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The user's numeric ID",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        default: "10",
      },
      {
        name: "tweet.fields",
        type: "query",
        required: false,
        default: "author_id,created_at,public_metrics,entities,lang",
      },
      {
        name: "expansions",
        type: "query",
        required: false,
        default: "author_id",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type",
      },
    ],
    rateLimit: "450 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "user-followers": {
    name: "User Followers",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/followers",
    description: "Get a user's followers",
    explanation:
      "Returns a list of users who follow the specified user. Useful for audience analysis and understanding a user's reach.",
    whenToUse: "When you want to see who follows a specific account.",
    whatToExpect:
      "Returns an array of User objects representing followers. Paginated — use meta.next_token for more results. Large accounts may have millions of followers.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The user's numeric ID",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        description: "Results per page (1-1000)",
        default: "20",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "15 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  "user-following": {
    name: "User Following",
    category: "Users",
    method: "GET",
    path: "/2/users/:id/following",
    description: "Get accounts a user follows",
    explanation:
      "Returns a list of users that the specified user follows. Useful for understanding someone's interests and network.",
    whenToUse: "When you want to see who a specific account follows.",
    whatToExpect:
      "Returns an array of User objects. Same structure as followers endpoint.",
    params: [
      {
        name: "id",
        type: "path",
        required: true,
        description: "The user's numeric ID",
        placeholder: "44196397",
      },
      {
        name: "max_results",
        type: "query",
        required: false,
        default: "20",
      },
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "name,username,profile_image_url,verified,verified_type,public_metrics,description",
      },
    ],
    rateLimit: "15 requests per 15-minute window (per app)",
    accessLevel: "Pay-per-use and above",
  },

  // =========================================================================
  // AUTHENTICATED USER — Endpoints for "me"
  // =========================================================================

  "me": {
    name: "Authenticated User (Me)",
    category: "Account",
    method: "GET",
    path: "/2/users/me",
    description: "Get the authenticated user's profile",
    explanation:
      "Returns the profile of the user who owns the Bearer Token. Note: this only works with OAuth 2.0 User Context (user tokens), NOT with App-only Bearer Tokens. If you're using an app-level Bearer Token, this will return a 403 error.",
    whenToUse:
      "When you want to check which account your token belongs to, or get your own user ID.",
    whatToExpect:
      "Returns your User object if using a user token. Returns 403 'Forbidden' if using an app-only Bearer Token (which is what most setups use). This is normal — use user-by-username instead.",
    params: [
      {
        name: "user.fields",
        type: "query",
        required: false,
        default: "created_at,description,id,name,profile_image_url,public_metrics,username,verified,verified_type",
      },
    ],
    rateLimit: "75 requests per 15-minute window",
    accessLevel: "Requires OAuth 2.0 User Context",
  },
};

export default ENDPOINTS;

/**
 * Get all endpoints grouped by category.
 */
export function getEndpointsByCategory() {
  const categories = {};
  for (const [key, endpoint] of Object.entries(ENDPOINTS)) {
    const cat = endpoint.category;
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ key, ...endpoint });
  }
  return categories;
}

/**
 * Build the actual URL for an endpoint given its parameter values.
 */
export function buildEndpointUrl(endpointKey, paramValues) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointKey}`);

  // Substitute path parameters
  let path = endpoint.path;
  for (const param of endpoint.params || []) {
    if (param.type === "path" && paramValues[param.name]) {
      path = path.replace(`:${param.name}`, encodeURIComponent(paramValues[param.name]));
    }
  }

  return path;
}
