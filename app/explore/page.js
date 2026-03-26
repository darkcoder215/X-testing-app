"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";
import ENDPOINTS, { getEndpointsByCategory } from "@/lib/endpoints";

/**
 * Explore Page — Interactive X API v2 Endpoint Tester
 *
 * This page lets you:
 * - Browse all available X API endpoints organized by category
 * - Read explanations of what each endpoint does and when to use it
 * - Fill in parameters and send test requests
 * - See the raw API response, the URL that was called, rate limits, and timing
 * - Understand error responses with friendly explanations
 *
 * HOW IT WORKS:
 * 1. Pick an endpoint from the sidebar
 * 2. Read the explanation to understand what it does
 * 3. Fill in the required parameters (and optionally tweak optional ones)
 * 4. Click "Send Request" — the request goes through your server to X's API
 * 5. See the response: formatted data + raw JSON + metadata (URL, status, rate limits)
 *
 * WHY THIS EXISTS:
 * Before building with an API, you need to understand what it returns.
 * This tool lets you experiment with real API calls and see real responses,
 * so you know exactly what data is available and what to expect.
 */
export default function ExplorePage() {
  const { token, apiFetch } = useAuth();
  const [selectedEndpoint, setSelectedEndpoint] = useState("post-lookup");
  const [paramValues, setParamValues] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const categories = getEndpointsByCategory();
  const endpoint = ENDPOINTS[selectedEndpoint];

  // Reset params when endpoint changes
  useEffect(() => {
    const defaults = {};
    for (const param of endpoint?.params || []) {
      if (param.default) defaults[param.name] = param.default;
    }
    setParamValues(defaults);
    setResult(null);
    setShowAdvanced(false);
  }, [selectedEndpoint]);

  async function handleSend() {
    if (!token) {
      setResult({ error: "No Bearer Token. Add one on the Setup page.", code: "AUTH_NOT_CONFIGURED" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await apiFetch("/api/x", {
        method: "POST",
        body: JSON.stringify({
          endpointKey: selectedEndpoint,
          params: paramValues,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message, code: "NETWORK_ERROR" });
    } finally {
      setLoading(false);
    }
  }

  const requiredParams = (endpoint?.params || []).filter((p) => p.required);
  const optionalParams = (endpoint?.params || []).filter((p) => !p.required);
  const canSend = requiredParams.every((p) => paramValues[p.name]?.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Explore API</h1>
        <p className="text-text-secondary mt-1">
          Test X API v2 endpoints interactively — see exactly what each one returns
        </p>
      </div>

      <div className="flex gap-6">
        {/* Endpoint Selector Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-surface border border-border rounded-xl overflow-hidden sticky top-8">
            {Object.entries(categories).map(([category, endpoints]) => (
              <div key={category}>
                <div className="px-4 py-2 bg-surface-light text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {category}
                </div>
                {endpoints.map((ep) => (
                  <button
                    key={ep.key}
                    onClick={() => setSelectedEndpoint(ep.key)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all-fast border-l-2 ${
                      selectedEndpoint === ep.key
                        ? "bg-primary/10 text-primary border-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-light border-transparent"
                    }`}
                  >
                    <div className="font-medium text-xs">{ep.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{ep.method} {ep.path}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Endpoint Header */}
          <InfoCard>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-text-primary">{endpoint.name}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary">
                    {endpoint.method}
                  </span>
                </div>
                <code className="text-sm text-text-secondary font-mono mt-1 block">
                  {endpoint.path}
                </code>
                <p className="text-sm text-text-secondary mt-2">{endpoint.description}</p>
              </div>
              <div className="text-right text-xs text-text-secondary flex-shrink-0">
                <div>{endpoint.rateLimit}</div>
                <div className="mt-1">{endpoint.accessLevel}</div>
              </div>
            </div>
          </InfoCard>

          {/* Explanation */}
          <InfoCard title="What This Does" description="Understanding the endpoint before using it">
            <div className="space-y-3">
              <p className="text-sm text-text-primary">{endpoint.explanation}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-surface-light rounded-lg">
                  <p className="text-xs font-semibold text-primary mb-1">When to use</p>
                  <p className="text-xs text-text-secondary">{endpoint.whenToUse}</p>
                </div>
                <div className="p-3 bg-surface-light rounded-lg">
                  <p className="text-xs font-semibold text-success mb-1">What to expect</p>
                  <p className="text-xs text-text-secondary">{endpoint.whatToExpect}</p>
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Parameters */}
          <InfoCard title="Parameters" description="Fill in the fields and send a test request">
            <div className="space-y-4">
              {/* Required params */}
              {requiredParams.map((param) => (
                <ParamInput
                  key={param.name}
                  param={param}
                  value={paramValues[param.name] || ""}
                  onChange={(val) =>
                    setParamValues((prev) => ({ ...prev, [param.name]: val }))
                  }
                />
              ))}

              {/* Optional params toggle */}
              {optionalParams.length > 0 && (
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-primary hover:text-primary-dark transition-all-fast"
                >
                  {showAdvanced ? "Hide" : "Show"} optional fields ({optionalParams.length})
                </button>
              )}

              {showAdvanced &&
                optionalParams.map((param) => (
                  <ParamInput
                    key={param.name}
                    param={param}
                    value={paramValues[param.name] || ""}
                    onChange={(val) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: val }))
                    }
                  />
                ))}

              {/* Send button */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSend}
                  disabled={loading || !canSend || !token}
                  className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all-fast"
                >
                  {loading ? "Sending..." : "Send Request"}
                </button>
                {!token && (
                  <span className="text-xs text-warning">Add your Bearer Token on the Setup page first</span>
                )}
              </div>
            </div>
          </InfoCard>

          {/* Result */}
          {result && <ResponseDisplay result={result} endpointKey={selectedEndpoint} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Parameter input field with description and type info.
 */
function ParamInput({ param, value, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1.5">
        <code className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">{param.name}</code>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          param.required
            ? "bg-error/10 text-error"
            : "bg-surface-lighter text-text-secondary"
        }`}>
          {param.required ? "required" : "optional"}
        </span>
        <span className="text-[10px] text-text-secondary">{param.type}</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder || param.default || ""}
        className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono"
      />
      {param.description && (
        <p className="text-xs text-text-secondary mt-1">{param.description}</p>
      )}
      {param.options && (
        <p className="text-[10px] text-text-secondary mt-0.5 font-mono">
          Options: {param.options}
        </p>
      )}
    </div>
  );
}

/**
 * Response display — shows the full API response with metadata, cost info, and missing data analysis.
 */
function ResponseDisplay({ result, endpointKey }) {
  const [viewMode, setViewMode] = useState("formatted"); // formatted | breakdown | raw | cost
  const meta = result.meta || {};

  return (
    <div className="space-y-4">
      {/* Request info bar */}
      {meta.url && (
        <InfoCard>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary">{meta.method}</span>
              <code className="text-xs text-text-primary font-mono break-all flex-1">{meta.url}</code>
            </div>
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <StatusBadge
                status={meta.status < 300 ? "success" : meta.status < 500 ? "warning" : "error"}
                label={`${meta.status} ${meta.statusText}`}
              />
              {meta.elapsed && (
                <span className="text-text-secondary">{meta.elapsed}ms</span>
              )}
              {meta.rateLimit?.remaining && (
                <span className="text-text-secondary">
                  Rate limit: {meta.rateLimit.remaining}/{meta.rateLimit.limit} remaining
                </span>
              )}
              {meta.rateLimit?.reset && (
                <span className="text-text-secondary">
                  Resets: {new Date(parseInt(meta.rateLimit.reset) * 1000).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* cURL equivalent */}
            <details className="text-xs">
              <summary className="text-primary cursor-pointer hover:text-primary-dark">
                Show cURL command
              </summary>
              <pre className="mt-2 p-3 bg-black/50 rounded text-text-secondary overflow-x-auto font-mono">
                {`curl '${meta.url}' \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "User-Agent: x-filtered-stream/2.0.0"`}
              </pre>
            </details>
          </div>
        </InfoCard>
      )}

      {/* Error display */}
      {result.error && (
        <ErrorDisplay
          error={result.error}
          code={result.code}
          hint={result.hint}
        />
      )}

      {/* Missing data analysis - always show if we have data */}
      {result.data && <MissingDataAnalyzer response={result.data} endpointKey={endpointKey} requestUrl={meta.url} />}

      {/* Response data */}
      {result.data && (
        <InfoCard
          title="Response"
          description={
            result.data.meta?.result_count !== undefined
              ? `${result.data.meta.result_count} result(s) returned`
              : result.data.data
                ? Array.isArray(result.data.data)
                  ? `${result.data.data.length} item(s)`
                  : "1 item"
                : ""
          }
        >
          {/* View toggle */}
          <div className="flex items-center gap-1 mb-4 flex-wrap">
            {["formatted", "breakdown", "raw", "cost"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs rounded transition-all-fast ${
                  viewMode === mode
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {mode === "formatted" ? "Formatted" : mode === "breakdown" ? "Full Breakdown" : mode === "raw" ? "Raw JSON" : "Cost & Usage"}
              </button>
            ))}
          </div>

          {viewMode === "raw" ? (
            <pre className="bg-black/50 p-4 rounded-lg text-xs text-text-secondary font-mono overflow-auto max-h-[600px] whitespace-pre-wrap break-words">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          ) : viewMode === "breakdown" ? (
            <FullResponseBreakdown data={result.data} />
          ) : viewMode === "cost" ? (
            <CostUsagePanel meta={meta} endpointKey={endpointKey} response={result.data} />
          ) : (
            <FormattedResponse data={result.data} endpointKey={endpointKey} />
          )}

          {/* Pagination hint */}
          {result.data.meta?.next_token && (
            <ExplainerBox type="info" title="More results available">
              This response has a <code className="text-xs">next_token</code>: <code className="text-xs">{result.data.meta.next_token}</code>.
              Paste it into the <code className="text-xs">pagination_token</code> field and send again to get the next page.
            </ExplainerBox>
          )}
        </InfoCard>
      )}
    </div>
  );
}

/**
 * Formatted view of API response data — renders Posts and Users nicely.
 */
function FormattedResponse({ data, endpointKey }) {
  const items = data.data;
  const includes = data.includes;

  if (!items) {
    return <p className="text-text-secondary text-sm">No data in response.</p>;
  }

  // Single item (post-lookup, user-by-username, etc.)
  if (!Array.isArray(items)) {
    if (items.text !== undefined) {
      return <PostItem post={items} includes={includes} />;
    }
    if (items.username !== undefined) {
      return <UserItem user={items} includes={includes} />;
    }
    return (
      <pre className="text-xs text-text-secondary font-mono bg-black/30 p-3 rounded overflow-auto">
        {JSON.stringify(items, null, 2)}
      </pre>
    );
  }

  // Array of items
  if (items.length === 0) {
    return <p className="text-text-secondary text-sm">No results found.</p>;
  }

  // Determine if Posts or Users
  const isUsers = items[0]?.username !== undefined;

  return (
    <div className="divide-y divide-border space-y-0">
      {items.map((item, i) =>
        isUsers ? (
          <UserItem key={item.id || i} user={item} includes={includes} />
        ) : (
          <PostItem key={item.id || i} post={item} includes={includes} />
        )
      )}
    </div>
  );
}

function PostItem({ post, includes }) {
  const author = includes?.users?.find((u) => u.id === post.author_id);

  return (
    <div className="py-3">
      {/* Author */}
      {author && (
        <div className="flex items-center gap-2 mb-1.5">
          {author.profile_image_url && (
            <img src={author.profile_image_url} alt="" className="w-6 h-6 rounded-full" />
          )}
          <span className="text-sm font-medium text-text-primary">{author.name}</span>
          <span className="text-xs text-text-secondary">@{author.username}</span>
          {author.verified_type && <StatusBadge status="info" label={author.verified_type} />}
          <span className="text-xs text-text-secondary ml-auto">
            {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
          </span>
        </div>
      )}

      {/* Text */}
      <p className="text-sm text-text-primary whitespace-pre-wrap">{post.text}</p>

      {/* Metrics */}
      {post.public_metrics && (
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span>{"\u2665"} {post.public_metrics.like_count?.toLocaleString()}</span>
          <span>{"\u21bb"} {post.public_metrics.retweet_count?.toLocaleString()}</span>
          <span>💬 {post.public_metrics.reply_count?.toLocaleString()}</span>
          {post.public_metrics.impression_count !== undefined && (
            <span>👁 {post.public_metrics.impression_count?.toLocaleString()}</span>
          )}
          {post.public_metrics.quote_count !== undefined && (
            <span>❝ {post.public_metrics.quote_count?.toLocaleString()}</span>
          )}
        </div>
      )}

      {/* Entities */}
      {post.entities?.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {post.entities.hashtags.map((h, i) => (
            <span key={i} className="text-xs text-primary">#{h.tag}</span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex gap-3 mt-1.5 text-[10px] text-text-secondary font-mono">
        <span>ID: {post.id}</span>
        {post.lang && <span>lang: {post.lang}</span>}
        {post.source && <span>source: {post.source}</span>}
        {post.conversation_id && post.conversation_id !== post.id && (
          <span>thread: {post.conversation_id}</span>
        )}
      </div>
    </div>
  );
}

function UserItem({ user }) {
  return (
    <div className="py-3 flex items-start gap-3">
      {user.profile_image_url && (
        <img src={user.profile_image_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-text-primary">{user.name}</span>
          <span className="text-xs text-text-secondary">@{user.username}</span>
          {user.verified_type && <StatusBadge status="info" label={user.verified_type} />}
        </div>
        {user.description && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{user.description}</p>
        )}
        {user.public_metrics && (
          <div className="flex gap-4 mt-1.5 text-xs text-text-secondary">
            <span>{user.public_metrics.followers_count?.toLocaleString()} followers</span>
            <span>{user.public_metrics.following_count?.toLocaleString()} following</span>
            <span>{user.public_metrics.tweet_count?.toLocaleString()} posts</span>
          </div>
        )}
        <div className="flex gap-3 mt-1 text-[10px] text-text-secondary font-mono">
          <span>ID: {user.id}</span>
          {user.location && <span>{user.location}</span>}
          {user.created_at && <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Full Response Breakdown — shows every section of the API response
// =============================================================================

function FullResponseBreakdown({ data }) {
  const sections = [];

  if (data.data !== undefined) {
    sections.push({
      key: "data",
      label: "data",
      description: "The primary result(s) you requested. This is the main payload — Posts, Users, or counts depending on the endpoint.",
      content: data.data,
      color: "text-primary",
      bgColor: "bg-primary/5 border-primary/20",
    });
  }

  if (data.includes) {
    const includeSummary = Object.keys(data.includes)
      .map((k) => `${k}: ${Array.isArray(data.includes[k]) ? data.includes[k].length : 1}`)
      .join(", ");
    sections.push({
      key: "includes",
      label: "includes",
      description: `Expanded/related objects requested via 'expansions'. Contains: ${includeSummary}. These are referenced by IDs in the 'data' section (e.g., author_id links to a user in includes.users).`,
      content: data.includes,
      color: "text-success",
      bgColor: "bg-success/5 border-success/20",
    });
  }

  if (data.meta) {
    sections.push({
      key: "meta",
      label: "meta",
      description: "Metadata about the response: result count, pagination tokens (next_token/previous_token), and total counts. Use next_token to get subsequent pages of results.",
      content: data.meta,
      color: "text-warning",
      bgColor: "bg-warning/5 border-warning/20",
    });
  }

  if (data.errors) {
    sections.push({
      key: "errors",
      label: "errors",
      description: "Partial errors — some data was returned but some items had issues. Common reasons: deleted Posts, suspended users, or protected accounts. The 'data' section still contains the items that succeeded.",
      content: data.errors,
      color: "text-error",
      bgColor: "bg-error/5 border-error/20",
    });
  }

  // Catch any other top-level keys
  const knownKeys = new Set(["data", "includes", "meta", "errors"]);
  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(key)) {
      sections.push({
        key,
        label: key,
        description: `Additional response field returned by the API.`,
        content: value,
        color: "text-text-secondary",
        bgColor: "bg-surface-light border-border",
      });
    }
  }

  if (sections.length === 0) {
    return <p className="text-text-secondary text-sm">Empty response.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Overview: which sections are present */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-text-secondary">Response contains:</span>
        {sections.map((s) => (
          <span key={s.key} className={`px-2 py-0.5 rounded font-mono font-medium ${s.color} ${s.bgColor} border`}>
            {s.label}
          </span>
        ))}
        {!data.includes && (
          <span className="px-2 py-0.5 rounded font-mono text-text-secondary bg-surface-light border border-border line-through opacity-50">
            includes (not requested)
          </span>
        )}
        {!data.errors && (
          <span className="px-2 py-0.5 rounded font-mono text-text-secondary bg-surface-light border border-border opacity-30">
            errors (none)
          </span>
        )}
      </div>

      {/* Each section */}
      {sections.map((section) => (
        <ResponseSection key={section.key} section={section} />
      ))}
    </div>
  );
}

function ResponseSection({ section }) {
  const [expanded, setExpanded] = useState(true);
  const itemCount = Array.isArray(section.content)
    ? section.content.length
    : typeof section.content === "object" && section.content !== null
      ? Object.keys(section.content).length
      : 1;

  return (
    <div className={`border rounded-lg overflow-hidden ${section.bgColor}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-black/5 transition-all-fast"
      >
        <div className="flex items-center gap-2">
          <code className={`text-sm font-bold font-mono ${section.color}`}>{section.label}</code>
          <span className="text-xs text-text-secondary">
            {Array.isArray(section.content) ? `${itemCount} item(s)` : typeof section.content === "object" ? `${itemCount} field(s)` : ""}
          </span>
        </div>
        <span className="text-text-secondary text-xs">{expanded ? "collapse" : "expand"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          <p className="text-xs text-text-secondary italic">{section.description}</p>
          <pre className="bg-black/30 p-3 rounded text-xs text-text-secondary font-mono overflow-auto max-h-[400px] whitespace-pre-wrap break-words">
            {JSON.stringify(section.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Missing Data Analyzer — highlights expansions/fields NOT being requested
// =============================================================================

const EXPANSION_GUIDE = {
  "author_id": {
    expansion: "author_id",
    unlocks: "includes.users",
    description: "Adds author profile info (name, username, avatar, metrics) to each Post",
    requiredField: "author_id in tweet.fields",
    fieldsParam: "user.fields",
  },
  "attachments.media_keys": {
    expansion: "attachments.media_keys",
    unlocks: "includes.media",
    description: "Adds media objects (images, videos, GIFs) attached to Posts",
    requiredField: "attachments in tweet.fields",
    fieldsParam: "media.fields",
    defaultFields: "url,preview_image_url,type,width,height,alt_text,duration_ms,variants",
  },
  "attachments.poll_ids": {
    expansion: "attachments.poll_ids",
    unlocks: "includes.polls",
    description: "Adds poll data (options, votes, duration) for Posts with polls",
    requiredField: "attachments in tweet.fields",
    fieldsParam: "poll.fields",
    defaultFields: "id,options,duration_minutes,end_datetime,voting_status",
  },
  "geo.place_id": {
    expansion: "geo.place_id",
    unlocks: "includes.places",
    description: "Adds location/place info for geo-tagged Posts",
    requiredField: "geo in tweet.fields",
    fieldsParam: "place.fields",
    defaultFields: "full_name,id,country,country_code,geo,name,place_type",
  },
  "referenced_tweets.id": {
    expansion: "referenced_tweets.id",
    unlocks: "includes.tweets",
    description: "Adds the original Post for replies, retweets, and quotes — so you can see what was replied to or quoted",
    requiredField: "referenced_tweets in tweet.fields",
    fieldsParam: null,
  },
  "referenced_tweets.id.author_id": {
    expansion: "referenced_tweets.id.author_id",
    unlocks: "includes.users (for referenced tweet authors)",
    description: "Adds author info for referenced (quoted/replied-to) Posts",
    requiredField: "referenced_tweets in tweet.fields",
    fieldsParam: null,
  },
  "in_reply_to_user_id": {
    expansion: "in_reply_to_user_id",
    unlocks: "includes.users (for the user being replied to)",
    description: "Adds the user profile of who the Post is replying to",
    requiredField: "in_reply_to_user_id in tweet.fields",
    fieldsParam: "user.fields",
  },
  "entities.mentions.username": {
    expansion: "entities.mentions.username",
    unlocks: "includes.users (for mentioned users)",
    description: "Adds full user profiles for all @mentioned users in the Post",
    requiredField: "entities in tweet.fields",
    fieldsParam: "user.fields",
  },
  "pinned_tweet_id": {
    expansion: "pinned_tweet_id",
    unlocks: "includes.tweets (pinned tweet)",
    description: "Adds the user's pinned Post data when looking up users",
    requiredField: "pinned_tweet_id in user.fields",
    fieldsParam: "tweet.fields",
  },
};

const TWEET_FIELD_GUIDE = {
  "attachments": "Attachment keys (media + poll IDs). Required for media/poll expansions.",
  "context_annotations": "Topic/entity annotations by X's NLP. Shows what the Post is about (e.g., 'Technology', 'Sports').",
  "conversation_id": "ID of the conversation thread. Same as Post ID for thread starters.",
  "edit_controls": "Edit history: whether the Post was edited, how many edits remain, edit deadline.",
  "geo": "Geographic location data. Required for place expansion. Most Posts don't have this.",
  "in_reply_to_user_id": "User ID of who this Post replies to. Required for reply-to-user expansion.",
  "possibly_sensitive": "Whether the Post may contain sensitive content (flagged by author or X).",
  "referenced_tweets": "Array of referenced Posts (replied_to, retweeted, quoted). Critical for understanding Post relationships.",
  "reply_settings": "Who can reply: 'everyone', 'mentionedUsers', or 'following'.",
  "withheld": "Withholding info if the Post is restricted in certain countries.",
};

function MissingDataAnalyzer({ response, endpointKey, requestUrl }) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) return null;

  // Only analyze Post-related endpoints
  const isPostEndpoint = endpoint.category === "Posts" || ["user-tweets", "user-mentions"].includes(endpointKey);
  const isUserEndpoint = endpoint.category === "Users" || endpoint.category === "Account";

  // Parse what was actually requested from the URL
  const url = requestUrl ? new URL(requestUrl) : null;
  const requestedExpansions = (url?.searchParams.get("expansions") || "").split(",").filter(Boolean);
  const requestedTweetFields = (url?.searchParams.get("tweet.fields") || "").split(",").filter(Boolean);
  const requestedUserFields = (url?.searchParams.get("user.fields") || "").split(",").filter(Boolean);
  const requestedMediaFields = (url?.searchParams.get("media.fields") || "").split(",").filter(Boolean);
  const requestedPlaceFields = (url?.searchParams.get("place.fields") || "").split(",").filter(Boolean);
  const requestedPollFields = (url?.searchParams.get("poll.fields") || "").split(",").filter(Boolean);

  const suggestions = [];

  if (isPostEndpoint && endpointKey !== "tweet-counts") {
    // Check missing expansions
    const allPostExpansions = [
      "author_id", "attachments.media_keys", "attachments.poll_ids",
      "geo.place_id", "referenced_tweets.id", "referenced_tweets.id.author_id",
      "in_reply_to_user_id", "entities.mentions.username",
    ];

    for (const exp of allPostExpansions) {
      if (!requestedExpansions.includes(exp) && EXPANSION_GUIDE[exp]) {
        const guide = EXPANSION_GUIDE[exp];
        suggestions.push({
          type: "expansion",
          param: "expansions",
          value: exp,
          ...guide,
          severity: exp === "attachments.media_keys" ? "high" : exp === "referenced_tweets.id" ? "high" : "medium",
        });
      }
    }

    // Check missing tweet fields
    const allTweetFields = [
      "attachments", "context_annotations", "conversation_id", "edit_controls",
      "geo", "in_reply_to_user_id", "possibly_sensitive", "referenced_tweets",
      "reply_settings", "withheld",
    ];

    for (const field of allTweetFields) {
      if (!requestedTweetFields.includes(field) && TWEET_FIELD_GUIDE[field]) {
        suggestions.push({
          type: "field",
          param: "tweet.fields",
          value: field,
          description: TWEET_FIELD_GUIDE[field],
          severity: field === "referenced_tweets" ? "high" : field === "attachments" ? "high" : "low",
        });
      }
    }

    // Check if expansions are set but supporting fields params are missing
    if (requestedExpansions.includes("attachments.media_keys") && requestedMediaFields.length === 0) {
      suggestions.unshift({
        type: "missing-fields-param",
        param: "media.fields",
        value: "url,preview_image_url,type,width,height,alt_text",
        description: "You have the media expansion but no media.fields specified — you'll only get media keys without URLs or dimensions. Add media.fields to get the actual media data.",
        severity: "critical",
      });
    }
    if (requestedExpansions.includes("attachments.poll_ids") && requestedPollFields.length === 0) {
      suggestions.unshift({
        type: "missing-fields-param",
        param: "poll.fields",
        value: "id,options,duration_minutes,end_datetime,voting_status",
        description: "You have the poll expansion but no poll.fields — add poll.fields to get poll options and vote counts.",
        severity: "critical",
      });
    }
    if (requestedExpansions.includes("geo.place_id") && requestedPlaceFields.length === 0) {
      suggestions.unshift({
        type: "missing-fields-param",
        param: "place.fields",
        value: "full_name,country,country_code,geo,name,place_type",
        description: "You have the geo expansion but no place.fields — add place.fields to get location names and coordinates.",
        severity: "critical",
      });
    }
  }

  if (isUserEndpoint && !["user-followers", "user-following"].includes(endpointKey)) {
    if (!requestedExpansions.includes("pinned_tweet_id") && requestedUserFields.includes("pinned_tweet_id")) {
      suggestions.push({
        type: "expansion",
        param: "expansions",
        value: "pinned_tweet_id",
        description: "You're requesting pinned_tweet_id but not expanding it — add 'pinned_tweet_id' to expansions to get the actual pinned Post content.",
        severity: "high",
      });
    }
  }

  // Check for signs of missing data in the response
  const responseHints = [];
  const items = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];

  for (const item of items.slice(0, 5)) {
    if (item.attachments?.media_keys && !response.includes?.media) {
      responseHints.push("This Post has media attachments but no media data was returned — add 'attachments.media_keys' to expansions and 'media.fields' to see images/videos.");
    }
    if (item.referenced_tweets?.length > 0 && !response.includes?.tweets) {
      responseHints.push("This Post references other Posts (reply/quote/retweet) but the referenced Posts weren't expanded — add 'referenced_tweets.id' to expansions to see the original content.");
    }
    if (item.author_id && !response.includes?.users) {
      responseHints.push("Posts have author_id but no user info was included — add 'author_id' to expansions to see author names and profiles.");
    }
    if (item.geo?.place_id && !response.includes?.places) {
      responseHints.push("This Post has geo data but places weren't expanded — add 'geo.place_id' to expansions.");
    }
  }
  // Deduplicate hints
  const uniqueHints = [...new Set(responseHints)];

  if (suggestions.length === 0 && uniqueHints.length === 0) return null;

  const criticalSuggestions = suggestions.filter((s) => s.severity === "critical");
  const highSuggestions = suggestions.filter((s) => s.severity === "high");
  const otherSuggestions = suggestions.filter((s) => s.severity !== "critical" && s.severity !== "high");

  return (
    <InfoCard
      title="Data You're Missing"
      description="Optional fields and expansions that could enrich your response"
    >
      <div className="space-y-3">
        {/* Active warnings from response analysis */}
        {uniqueHints.length > 0 && (
          <div className="space-y-2">
            {uniqueHints.map((hint, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-lg">
                <span className="text-warning text-sm flex-shrink-0">!</span>
                <p className="text-xs text-warning">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {/* Critical: missing fields params for active expansions */}
        {criticalSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-error">Missing field parameters (data won&apos;t be complete)</p>
            {criticalSuggestions.map((s, i) => (
              <SuggestionRow key={i} suggestion={s} />
            ))}
          </div>
        )}

        {/* High priority: key expansions */}
        {highSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-warning">Recommended expansions (commonly needed data)</p>
            {highSuggestions.map((s, i) => (
              <SuggestionRow key={i} suggestion={s} />
            ))}
          </div>
        )}

        {/* Other optional expansions/fields */}
        {otherSuggestions.length > 0 && (
          <details className="text-xs">
            <summary className="text-primary cursor-pointer hover:text-primary-dark font-medium">
              {otherSuggestions.length} more optional fields/expansions available
            </summary>
            <div className="mt-2 space-y-2">
              {otherSuggestions.map((s, i) => (
                <SuggestionRow key={i} suggestion={s} />
              ))}
            </div>
          </details>
        )}
      </div>
    </InfoCard>
  );
}

function SuggestionRow({ suggestion }) {
  const severityColors = {
    critical: "border-error/30 bg-error/5",
    high: "border-warning/30 bg-warning/5",
    medium: "border-border bg-surface-light",
    low: "border-border bg-surface-light",
  };

  return (
    <div className={`p-2.5 rounded-lg border ${severityColors[suggestion.severity] || severityColors.low}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          {suggestion.param}
        </code>
        <span className="text-text-secondary text-[10px]">add:</span>
        <code className="text-xs font-mono text-text-primary bg-black/20 px-1.5 py-0.5 rounded">
          {suggestion.value}
        </code>
        {suggestion.unlocks && (
          <span className="text-[10px] text-success">
            unlocks {suggestion.unlocks}
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary mt-1">{suggestion.description}</p>
    </div>
  );
}

// =============================================================================
// Cost & Usage Panel — rate limits, volume, and pricing context
// =============================================================================

function CostUsagePanel({ meta, endpointKey, response }) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) return null;

  const rl = meta.rateLimit || {};
  const remaining = parseInt(rl.remaining);
  const limit = parseInt(rl.limit);
  const reset = rl.reset ? new Date(parseInt(rl.reset) * 1000) : null;
  const used = !isNaN(limit) && !isNaN(remaining) ? limit - remaining : null;
  const usagePercent = !isNaN(limit) && !isNaN(remaining) ? ((limit - remaining) / limit) * 100 : null;

  // Count items returned
  const dataItems = Array.isArray(response?.data) ? response.data.length : response?.data ? 1 : 0;

  return (
    <div className="space-y-4">
      {/* Rate Limit Visualization */}
      <div className="p-4 bg-surface-light rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">Rate Limit Status</h4>

        {!isNaN(limit) ? (
          <>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-text-secondary">Used: </span>
                <span className="text-text-primary font-medium">{used}/{limit}</span>
              </div>
              <div>
                <span className="text-text-secondary">Remaining: </span>
                <span className={`font-medium ${remaining < limit * 0.1 ? "text-error" : remaining < limit * 0.3 ? "text-warning" : "text-success"}`}>
                  {remaining}
                </span>
              </div>
              {reset && (
                <div>
                  <span className="text-text-secondary">Resets at: </span>
                  <span className="text-text-primary">{reset.toLocaleTimeString()}</span>
                  <span className="text-text-secondary ml-1">({Math.max(0, Math.round((reset.getTime() - Date.now()) / 1000))}s)</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent > 90 ? "bg-error" : usagePercent > 70 ? "bg-warning" : "bg-success"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-text-secondary">Rate limit headers not returned for this request.</p>
        )}

        <p className="text-xs text-text-secondary">
          Endpoint limit: {endpoint.rateLimit}
        </p>
      </div>

      {/* What This Request Cost */}
      <div className="p-4 bg-surface-light rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">What This Request Cost</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-black/10 rounded">
            <p className="text-text-secondary">Rate limit consumed</p>
            <p className="text-text-primary font-medium text-lg">1 request</p>
            <p className="text-text-secondary mt-1">Each API call uses 1 request from your 15-minute window, regardless of how many results are returned.</p>
          </div>
          <div className="p-3 bg-black/10 rounded">
            <p className="text-text-secondary">Posts returned</p>
            <p className="text-text-primary font-medium text-lg">{dataItems} item(s)</p>
            <p className="text-text-secondary mt-1">
              {endpointKey === "tweet-counts"
                ? "Count endpoints don't return Posts themselves, just counts — these don't count toward your monthly Post cap."
                : `Each Post returned counts toward your monthly Post read cap. The Basic tier includes 10,000 Posts/month reads.`
              }
            </p>
          </div>
        </div>
        {meta.elapsed && (
          <p className="text-xs text-text-secondary">Response time: {meta.elapsed}ms</p>
        )}
      </div>

      {/* Pricing Context */}
      <div className="p-4 bg-surface-light rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">X API Pricing Context</h4>
        <div className="space-y-2 text-xs text-text-secondary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2.5 bg-black/10 rounded">
              <p className="font-medium text-text-primary">Free Tier</p>
              <p>1,500 Posts/month write</p>
              <p>No read access</p>
              <p className="text-[10px] mt-1">$0/month</p>
            </div>
            <div className="p-2.5 bg-black/10 rounded border border-primary/20">
              <p className="font-medium text-primary">Basic Tier</p>
              <p>10,000 Posts/month read</p>
              <p>3,000 Posts/month write</p>
              <p className="text-[10px] mt-1">$200/month</p>
            </div>
            <div className="p-2.5 bg-black/10 rounded">
              <p className="font-medium text-text-primary">Pro Tier</p>
              <p>1,000,000 Posts/month read</p>
              <p>300,000 Posts/month write</p>
              <p className="text-[10px] mt-1">$5,000/month</p>
            </div>
          </div>

          <ExplainerBox type="info" title="How Posts are counted">
            Every Post object returned in a <code className="text-xs">data</code> array counts as 1 Post read toward your monthly cap.
            A request returning 10 Posts = 10 reads used. Expansions (includes) don&apos;t count extra.
            The <code className="text-xs">tweet/counts</code> endpoint returns only counts, not Post objects, so it doesn&apos;t consume Post reads.
            Rate limits (requests/15 min) are separate from monthly Post caps.
          </ExplainerBox>
        </div>
      </div>

      {/* Rate Limit Guide */}
      <div className="p-4 bg-surface-light rounded-lg space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">Rate Limit Guide for This Endpoint</h4>
        <div className="text-xs text-text-secondary space-y-2">
          <p>
            <span className="text-text-primary font-medium">{endpoint.rateLimit}</span> —
            This is a per-app limit shared across all users of your application.
          </p>
          <p>
            <span className="text-text-primary font-medium">Access level:</span> {endpoint.accessLevel}
          </p>
          <div className="p-2.5 bg-black/10 rounded space-y-1">
            <p className="font-medium text-text-primary">Rate limit headers explained:</p>
            <p><code className="text-primary">x-rate-limit-limit</code> — Maximum requests allowed in the 15-min window</p>
            <p><code className="text-primary">x-rate-limit-remaining</code> — Requests left before hitting the limit</p>
            <p><code className="text-primary">x-rate-limit-reset</code> — Unix timestamp when the window resets (limit refills)</p>
          </div>
          <p>
            If you hit the rate limit (429), wait until the reset time. The Filtered Stream doesn&apos;t use per-request rate limits since it&apos;s a persistent connection.
          </p>
        </div>
      </div>
    </div>
  );
}
