"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";
import ENDPOINTS, { getEndpointsByCategory } from "@/lib/endpoints";

// Arabic labels for endpoint categories
const CATEGORY_AR = { Posts: "التغريدات", Users: "الحسابات", Account: "حسابك" };

export default function ExplorePage() {
  const { token, apiFetch } = useAuth();
  const [selectedEndpoint, setSelectedEndpoint] = useState("post-lookup");
  const [paramValues, setParamValues] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const categories = getEndpointsByCategory();
  const endpoint = ENDPOINTS[selectedEndpoint];

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
      setResult({ error: "لم تتم إضافة مفتاح الوصول بعد.", code: "AUTH_NOT_CONFIGURED" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiFetch("/api/x", {
        method: "POST",
        body: JSON.stringify({ endpointKey: selectedEndpoint, params: paramValues }),
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
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl font-black text-text-primary">استكشاف</h1>
        <p className="font-body text-text-secondary mt-2 text-base">
          جرّب واجهات X البرمجية وشوف النتائج مباشرة
        </p>
      </div>

      <div className="flex gap-6">
        {/* Endpoint Selector */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-surface rounded-[16px] shadow-card overflow-hidden sticky top-8">
            {Object.entries(categories).map(([category, endpoints]) => (
              <div key={category}>
                <div className="px-4 py-2.5 bg-brand-black text-xs font-black text-white tracking-wider">
                  {CATEGORY_AR[category] || category}
                </div>
                {endpoints.map((ep) => (
                  <button
                    key={ep.key}
                    onClick={() => setSelectedEndpoint(ep.key)}
                    className={`w-full text-right px-4 py-3 text-sm transition-all-fast border-r-[3px] ${
                      selectedEndpoint === ep.key
                        ? "bg-brand-green/10 text-brand-green border-brand-green"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-light border-transparent"
                    }`}
                  >
                    <div className="font-bold text-xs">{ep.name}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 font-mono" dir="ltr">{ep.method} {ep.path}</div>
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
                  <h2 className="font-display text-xl font-bold text-text-primary">{endpoint.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-brand-green/10 text-brand-green">
                    {endpoint.method}
                  </span>
                </div>
                <code className="text-sm text-text-secondary font-mono mt-1 block" dir="ltr">{endpoint.path}</code>
                <p className="text-sm text-text-secondary mt-2 font-body">{endpoint.description}</p>
              </div>
              <div className="text-left text-xs text-text-muted flex-shrink-0 font-mono" dir="ltr">
                <div>{endpoint.rateLimit}</div>
                <div className="mt-1">{endpoint.accessLevel}</div>
              </div>
            </div>
            {/* Inline explanation */}
            <p className="text-xs text-text-secondary mt-3 font-body leading-relaxed border-t border-border pt-3">{endpoint.explanation}</p>
          </InfoCard>

          {/* Parameters */}
          <InfoCard title="المُدخلات" description="املأ الحقول وأرسل الطلب">
            <div className="space-y-4">
              {requiredParams.map((param) => (
                <ParamInput key={param.name} param={param} value={paramValues[param.name] || ""} onChange={(val) => setParamValues((prev) => ({ ...prev, [param.name]: val }))} />
              ))}

              {optionalParams.length > 0 && (
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-link hover:underline font-bold transition-all-fast">
                  {showAdvanced ? "إخفاء" : "عرض"} الحقول الاختيارية ({optionalParams.length})
                </button>
              )}

              {showAdvanced && optionalParams.map((param) => (
                <ParamInput key={param.name} param={param} value={paramValues[param.name] || ""} onChange={(val) => setParamValues((prev) => ({ ...prev, [param.name]: val }))} />
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSend} disabled={loading || !canSend || !token} className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? "جارٍ الإرسال..." : "أرسل الطلب"}
                </button>
                {!token && <span className="text-xs text-amber font-bold">أضف مفتاح الوصول أولًا</span>}
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

function ParamInput({ param, value, onChange }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-bold text-text-primary mb-1.5">
        <code className="text-link text-xs bg-brand-blue/10 px-2 py-0.5 rounded-full font-mono">{param.name}</code>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${param.required ? "bg-brand-red/10 text-brand-red" : "bg-surface-lighter text-text-muted"}`}>
          {param.required ? "مطلوب" : "اختياري"}
        </span>
      </label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder || param.default || ""} dir="ltr"
        className="w-full px-4 py-3 bg-surface-light border border-border rounded-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm font-mono"
      />
      {param.description && <p className="text-xs text-text-secondary mt-1 font-body">{param.description}</p>}
    </div>
  );
}

function ResponseDisplay({ result, endpointKey }) {
  const [viewMode, setViewMode] = useState("formatted");
  const meta = result.meta || {};
  const viewLabels = { formatted: "منسّق", raw: "JSON خام" };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Request info */}
      {meta.url && (
        <InfoCard>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-brand-green">{meta.method}</span>
              <code className="text-xs text-text-primary font-mono break-all flex-1" dir="ltr">{meta.url}</code>
            </div>
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <StatusBadge status={meta.status < 300 ? "success" : meta.status < 500 ? "warning" : "error"} label={`${meta.status} ${meta.statusText}`} />
              {meta.elapsed && <span className="text-text-muted">{meta.elapsed} مللي ثانية</span>}
              {meta.rateLimit?.remaining && <span className="text-text-muted">المتبقي: {meta.rateLimit.remaining}/{meta.rateLimit.limit}</span>}
            </div>
          </div>
        </InfoCard>
      )}

      {result.error && <ErrorDisplay error={result.error} code={result.code} hint={result.hint} />}

      {result.data && (
        <InfoCard
          title="النتيجة"
          description={
            result.data.meta?.result_count !== undefined ? `${result.data.meta.result_count} نتيجة`
              : result.data.data ? Array.isArray(result.data.data) ? `${result.data.data.length} عنصر` : "عنصر واحد" : ""
          }
        >
          {/* View toggle */}
          <div className="flex items-center gap-1 mb-4">
            {Object.entries(viewLabels).map(([mode, label]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all-fast ${viewMode === mode ? "bg-brand-green/10 text-brand-green" : "text-text-muted hover:text-text-primary"}`}>
                {label}
              </button>
            ))}
          </div>

          {viewMode === "raw" ? (
            <pre className="bg-dark-slate p-4 rounded-[12px] text-xs text-text-on-dark font-mono overflow-auto max-h-[600px] whitespace-pre-wrap break-words" dir="ltr">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          ) : (
            <FormattedResponse data={result.data} endpointKey={endpointKey} />
          )}

          {result.data.meta?.next_token && (
            <ExplainerBox type="info" title="توجد نتائج إضافية">
              الصق <code className="text-xs" dir="ltr">{result.data.meta.next_token}</code> في حقل <code className="text-xs" dir="ltr">pagination_token</code> وأرسل مرة أخرى.
            </ExplainerBox>
          )}

          {/* Quick insights */}
          <ResponseConclusion data={result.data} endpointKey={endpointKey} meta={meta} />
        </InfoCard>
      )}
    </div>
  );
}

/* ═══════════════ Conclusion ═══════════════ */

function ResponseConclusion({ data, endpointKey, meta }) {
  const items = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
  if (items.length === 0) return null;

  const insights = [];

  // Post insights
  if (items[0]?.text !== undefined) {
    const withMetrics = items.filter((p) => p.public_metrics);
    if (withMetrics.length > 0) {
      const totalLikes = withMetrics.reduce((s, p) => s + (p.public_metrics.like_count || 0), 0);
      const totalRTs = withMetrics.reduce((s, p) => s + (p.public_metrics.retweet_count || 0), 0);
      const avgLikes = Math.round(totalLikes / withMetrics.length);
      const avgRTs = Math.round(totalRTs / withMetrics.length);
      insights.push(`متوسط الإعجابات: ${avgLikes.toLocaleString()} — متوسط إعادة التغريد: ${avgRTs.toLocaleString()}`);
    }
    const langs = [...new Set(items.map((p) => p.lang).filter(Boolean))];
    if (langs.length > 0) insights.push(`اللغات: ${langs.join(", ")}`);
  }

  // User insights
  if (items[0]?.username !== undefined) {
    const withMetrics = items.filter((u) => u.public_metrics);
    if (withMetrics.length > 0) {
      const totalFollowers = withMetrics.reduce((s, u) => s + (u.public_metrics.followers_count || 0), 0);
      insights.push(`متوسط المتابعين: ${Math.round(totalFollowers / withMetrics.length).toLocaleString()}`);
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-brand-green-light/30 rounded-[12px] border border-brand-green/20">
      <p className="font-black text-brand-green text-sm mb-2">ملخص سريع</p>
      <ul className="space-y-1.5">
        {insights.map((ins, i) => (
          <li key={i} className="text-sm text-text-primary font-body leading-relaxed flex items-start gap-2">
            <span className="text-brand-green flex-shrink-0 mt-0.5">&#9670;</span>
            {ins}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════ Formatted Response ═══════════════ */

function FormattedResponse({ data, endpointKey }) {
  const items = data.data;
  const includes = data.includes;

  if (!items) return <p className="text-text-secondary text-sm font-body">لا توجد بيانات في الرد.</p>;

  if (!Array.isArray(items)) {
    if (items.text !== undefined) return <PostItem post={items} includes={includes} />;
    if (items.username !== undefined) return <UserItem user={items} />;
    return <pre className="text-xs text-text-secondary font-mono bg-surface-light p-4 rounded-[12px] overflow-auto" dir="ltr">{JSON.stringify(items, null, 2)}</pre>;
  }

  if (items.length === 0) return <p className="text-text-secondary text-sm font-body">لا توجد نتائج.</p>;

  const isUsers = items[0]?.username !== undefined;
  return (
    <div className="divide-y divide-border">
      {items.map((item, i) => isUsers ? <UserItem key={item.id || i} user={item} /> : <PostItem key={item.id || i} post={item} includes={includes} />)}
    </div>
  );
}

function PostItem({ post, includes }) {
  const author = includes?.users?.find((u) => u.id === post.author_id);
  return (
    <div className="py-4 animate-fade-in-up">
      {author && (
        <div className="flex items-center gap-2 mb-2">
          {author.profile_image_url && <img src={author.profile_image_url} alt="" className="w-8 h-8 rounded-full" />}
          <span className="text-sm font-bold text-text-primary">{author.name}</span>
          <span className="text-xs text-text-muted" dir="ltr">@{author.username}</span>
          {author.verified_type && <StatusBadge status="info" label={author.verified_type} />}
          <span className="text-xs text-text-muted mr-auto">{post.created_at ? new Date(post.created_at).toLocaleString("ar-SA") : ""}</span>
        </div>
      )}
      <p className="text-sm text-text-primary whitespace-pre-wrap font-body leading-relaxed">{post.text}</p>
      {post.public_metrics && (
        <div className="flex gap-5 mt-2 text-xs text-text-secondary">
          <span>{"\u2665"} {post.public_metrics.like_count?.toLocaleString()}</span>
          <span>{"\u21bb"} {post.public_metrics.retweet_count?.toLocaleString()}</span>
          <span>&#128172; {post.public_metrics.reply_count?.toLocaleString()}</span>
          {post.public_metrics.impression_count !== undefined && <span>&#128065; {post.public_metrics.impression_count?.toLocaleString()}</span>}
        </div>
      )}
      {post.entities?.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">{post.entities.hashtags.map((h, i) => <span key={i} className="text-xs text-link font-bold">#{h.tag}</span>)}</div>
      )}
    </div>
  );
}

function UserItem({ user }) {
  return (
    <div className="py-4 flex items-start gap-3 animate-fade-in-up">
      {user.profile_image_url && <img src={user.profile_image_url} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-text-primary">{user.name}</span>
          <span className="text-xs text-text-muted" dir="ltr">@{user.username}</span>
          {user.verified_type && <StatusBadge status="info" label={user.verified_type} />}
        </div>
        {user.description && <p className="text-xs text-text-secondary mt-1 font-body line-clamp-2">{user.description}</p>}
        {user.public_metrics && (
          <div className="flex gap-4 mt-1.5 text-xs text-text-secondary">
            <span>{user.public_metrics.followers_count?.toLocaleString()} متابع</span>
            <span>{user.public_metrics.following_count?.toLocaleString()} يتابع</span>
            <span>{user.public_metrics.tweet_count?.toLocaleString()} تغريدة</span>
          </div>
        )}
      </div>
    </div>
  );
}
