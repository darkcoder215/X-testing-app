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
 * Response display — shows the full API response with metadata.
 */
function ResponseDisplay({ result, endpointKey }) {
  const [viewMode, setViewMode] = useState("formatted"); // formatted | raw
  const meta = result.meta || {};
  const isError = result.error && !result.data;
  const hasData = result.data && !result.error;

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
            <div className="flex items-center gap-4 text-xs">
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
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setViewMode("formatted")}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === "formatted"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Formatted
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1 text-xs rounded ${
                viewMode === "raw"
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Raw JSON
            </button>
          </div>

          {viewMode === "raw" ? (
            <pre className="bg-black/50 p-4 rounded-lg text-xs text-text-secondary font-mono overflow-auto max-h-[600px] whitespace-pre-wrap break-words">
              {JSON.stringify(result.data, null, 2)}
            </pre>
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
