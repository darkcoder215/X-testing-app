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
      setResult({ error: "لم تتم إضافة مفتاح الوصول بعد. أضفه في صفحة الإعداد.", code: "AUTH_NOT_CONFIGURED" });
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
          جرّب واجهات X البرمجية وافهم ماذا تُرجع — قبل أن تبني أي شيء
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
          </InfoCard>

          {/* Explanation */}
          <InfoCard title="ماذا يفعل هذا؟" description="افهم الواجهة قبل استخدامها">
            <div className="space-y-3">
              <p className="text-sm text-text-primary font-body leading-relaxed">{endpoint.explanation}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-surface-light rounded-[12px]">
                  <p className="text-xs font-black text-brand-green mb-1">متى تستخدمه؟</p>
                  <p className="text-xs text-text-secondary font-body">{endpoint.whenToUse}</p>
                </div>
                <div className="p-4 bg-surface-light rounded-[12px]">
                  <p className="text-xs font-black text-brand-blue mb-1">ماذا تتوقع؟</p>
                  <p className="text-xs text-text-secondary font-body">{endpoint.whatToExpect}</p>
                </div>
              </div>
            </div>
          </InfoCard>

          {/* Parameters */}
          <InfoCard title="المُدخلات" description="املأ الحقول وأرسل طلب تجريبي">
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
                {!token && <span className="text-xs text-amber font-bold">أضف مفتاح الوصول أولًا في صفحة الإعداد</span>}
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
        <span className="text-[10px] text-text-muted">{param.type}</span>
      </label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder || param.default || ""} dir="ltr"
        className="w-full px-4 py-3 bg-surface-light border border-border rounded-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm font-mono"
      />
      {param.description && <p className="text-xs text-text-secondary mt-1 font-body">{param.description}</p>}
      {param.options && <p className="text-[10px] text-text-muted mt-0.5 font-mono" dir="ltr">Options: {param.options}</p>}
    </div>
  );
}

function ResponseDisplay({ result, endpointKey }) {
  const [viewMode, setViewMode] = useState("formatted");
  const meta = result.meta || {};
  const viewLabels = { formatted: "منسّق", breakdown: "تفصيل كامل", raw: "JSON خام", cost: "التكلفة والاستهلاك" };

  return (
    <div className="space-y-4 animate-fade-in-up">
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
              {meta.rateLimit?.remaining && <span className="text-text-muted">الحصة المتبقية: {meta.rateLimit.remaining}/{meta.rateLimit.limit}</span>}
              {meta.rateLimit?.reset && <span className="text-text-muted">تتجدد: {new Date(parseInt(meta.rateLimit.reset) * 1000).toLocaleTimeString("ar-SA")}</span>}
            </div>
            <details className="text-xs">
              <summary className="text-link cursor-pointer hover:underline font-bold">عرض أمر cURL</summary>
              <pre className="mt-2 p-3 bg-dark-slate rounded-[8px] text-text-on-dark overflow-x-auto font-mono" dir="ltr">
                {`curl '${meta.url}' \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "User-Agent: x-filtered-stream/2.0.0"`}
              </pre>
            </details>
          </div>
        </InfoCard>
      )}

      {result.error && <ErrorDisplay error={result.error} code={result.code} hint={result.hint} />}

      {result.data && <MissingDataAnalyzer response={result.data} endpointKey={endpointKey} requestUrl={meta.url} />}

      {result.data && (
        <InfoCard
          title="النتيجة"
          description={
            result.data.meta?.result_count !== undefined ? `${result.data.meta.result_count} نتيجة`
              : result.data.data ? Array.isArray(result.data.data) ? `${result.data.data.length} عنصر` : "عنصر واحد" : ""
          }
        >
          <div className="flex items-center gap-1 mb-4 flex-wrap">
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
          ) : viewMode === "breakdown" ? (
            <FullResponseBreakdown data={result.data} />
          ) : viewMode === "cost" ? (
            <CostUsagePanel meta={meta} endpointKey={endpointKey} response={result.data} />
          ) : (
            <FormattedResponse data={result.data} endpointKey={endpointKey} />
          )}

          {result.data.meta?.next_token && (
            <ExplainerBox type="info" title="توجد نتائج إضافية">
              الرد يحتوي على <code className="text-xs" dir="ltr">next_token</code>: <code className="text-xs" dir="ltr">{result.data.meta.next_token}</code>.
              الصقه في حقل <code className="text-xs" dir="ltr">pagination_token</code> وأرسل مرة أخرى للصفحة التالية.
            </ExplainerBox>
          )}

          {/* Conclusion */}
          <ResponseConclusion data={result.data} endpointKey={endpointKey} meta={meta} />
        </InfoCard>
      )}
    </div>
  );
}

/* ═══════════════ Conclusion — drives insights ═══════════════ */

function ResponseConclusion({ data, endpointKey, meta }) {
  const items = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
  if (items.length === 0) return null;

  const insights = [];
  const hasIncludes = !!data.includes;
  const hasUsers = !!data.includes?.users;
  const hasMedia = !!data.includes?.media;

  // Post-specific insights
  if (items[0]?.text !== undefined) {
    const withMetrics = items.filter((p) => p.public_metrics);
    if (withMetrics.length > 0) {
      const totalLikes = withMetrics.reduce((s, p) => s + (p.public_metrics.like_count || 0), 0);
      const totalRTs = withMetrics.reduce((s, p) => s + (p.public_metrics.retweet_count || 0), 0);
      const avgLikes = Math.round(totalLikes / withMetrics.length);
      const avgRTs = Math.round(totalRTs / withMetrics.length);
      insights.push(`متوسط الإعجابات: ${avgLikes.toLocaleString()} — متوسط إعادة التغريد: ${avgRTs.toLocaleString()}`);

      const topPost = withMetrics.sort((a, b) => (b.public_metrics.like_count || 0) - (a.public_metrics.like_count || 0))[0];
      if (topPost && withMetrics.length > 1) {
        insights.push(`التغريدة الأكثر تفاعلًا حصلت على ${topPost.public_metrics.like_count?.toLocaleString()} إعجاب`);
      }
    }

    const langs = [...new Set(items.map((p) => p.lang).filter(Boolean))];
    if (langs.length > 0) insights.push(`اللغات: ${langs.join(", ")}`);

    if (!hasIncludes) insights.push("لم تُطلب بيانات إضافية (includes) — يمكنك إضافة expansions لإثراء النتائج.");
    if (!hasMedia && items.some((p) => p.attachments?.media_keys)) insights.push("بعض التغريدات تحتوي وسائط لكن لم تُطلب — أضف attachments.media_keys للتوسعات.");
  }

  // User-specific insights
  if (items[0]?.username !== undefined) {
    const withMetrics = items.filter((u) => u.public_metrics);
    if (withMetrics.length > 0) {
      const totalFollowers = withMetrics.reduce((s, u) => s + (u.public_metrics.followers_count || 0), 0);
      const avgFollowers = Math.round(totalFollowers / withMetrics.length);
      insights.push(`متوسط المتابعين: ${avgFollowers.toLocaleString()}`);
    }
  }

  // Rate limit insight
  if (meta.rateLimit?.remaining) {
    const pct = Math.round((parseInt(meta.rateLimit.remaining) / parseInt(meta.rateLimit.limit)) * 100);
    if (pct < 20) insights.push(`تحذير: استهلكت ${100 - pct}% من حصة الطلبات. أبطئ الاستخدام.`);
  }

  if (insights.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-brand-green-light/30 rounded-[12px] border border-brand-green/20">
      <p className="font-black text-brand-green text-sm mb-2">الخلاصة والاستنتاجات</p>
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
      <div className="flex gap-3 mt-1.5 text-[10px] text-text-muted font-mono" dir="ltr">
        <span>ID: {post.id}</span>
        {post.lang && <span>lang: {post.lang}</span>}
        {post.source && <span>source: {post.source}</span>}
      </div>
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
        <div className="flex gap-3 mt-1 text-[10px] text-text-muted font-mono" dir="ltr">
          <span>ID: {user.id}</span>
          {user.location && <span>{user.location}</span>}
          {user.created_at && <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Full Response Breakdown ═══════════════ */

function FullResponseBreakdown({ data }) {
  const sectionDefs = [
    { key: "data", label: "data", arLabel: "البيانات الأساسية", desc: "النتائج الرئيسية التي طلبتها — تغريدات أو حسابات أو أعداد حسب الواجهة المستخدمة.", color: "text-brand-green", bg: "bg-brand-green/5 border-brand-green/20" },
    { key: "includes", label: "includes", arLabel: "البيانات المُوسّعة", desc: "عناصر مرتبطة طلبتها عبر expansions. مثل: بيانات الكاتب، الوسائط، التغريدات المُقتبسة. تُربط بالبيانات الأساسية عبر المعرّفات (IDs).", color: "text-brand-blue", bg: "bg-brand-blue/5 border-brand-blue/20" },
    { key: "meta", label: "meta", arLabel: "معلومات إضافية", desc: "بيانات وصفية: عدد النتائج، رمز الصفحة التالية (next_token) للتنقل بين الصفحات.", color: "text-amber", bg: "bg-amber/5 border-amber/20" },
    { key: "errors", label: "errors", arLabel: "أخطاء جزئية", desc: "بعض العناصر فشلت — قد تكون محذوفة أو محمية. البيانات الناجحة لا تزال في data.", color: "text-brand-red", bg: "bg-brand-red/5 border-brand-red/20" },
  ];

  const sections = sectionDefs.filter((s) => data[s.key] !== undefined).map((s) => ({ ...s, content: data[s.key] }));
  const knownKeys = new Set(["data", "includes", "meta", "errors"]);
  for (const [key, value] of Object.entries(data)) {
    if (!knownKeys.has(key)) sections.push({ key, label: key, arLabel: key, desc: "حقل إضافي.", content: value, color: "text-text-secondary", bg: "bg-surface-light border-border" });
  }

  if (sections.length === 0) return <p className="text-text-secondary text-sm font-body">رد فارغ.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-text-muted font-bold">الرد يحتوي:</span>
        {sections.map((s) => <span key={s.key} className={`px-2.5 py-0.5 rounded-full font-mono font-bold ${s.color} ${s.bg} border`}>{s.label}</span>)}
        {!data.includes && <span className="px-2.5 py-0.5 rounded-full font-mono text-text-muted bg-surface-light border border-border line-through opacity-50">includes (لم تُطلب)</span>}
      </div>
      {sections.map((section) => <ResponseSection key={section.key} section={section} />)}
    </div>
  );
}

function ResponseSection({ section }) {
  const [expanded, setExpanded] = useState(true);
  const itemCount = Array.isArray(section.content) ? section.content.length : typeof section.content === "object" && section.content !== null ? Object.keys(section.content).length : 1;
  return (
    <div className={`border rounded-[12px] overflow-hidden ${section.bg}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-surface-light/50 transition-all-fast">
        <div className="flex items-center gap-2">
          <code className={`text-sm font-black font-mono ${section.color}`}>{section.label}</code>
          <span className="text-xs text-text-muted font-bold">{section.arLabel}</span>
          <span className="text-xs text-text-muted">{Array.isArray(section.content) ? `${itemCount} عنصر` : typeof section.content === "object" ? `${itemCount} حقل` : ""}</span>
        </div>
        <span className="text-text-muted text-xs font-bold">{expanded ? "طي" : "توسيع"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-text-secondary font-body">{section.desc}</p>
          <pre className="bg-dark-slate/10 p-3 rounded-[8px] text-xs text-text-secondary font-mono overflow-auto max-h-[400px] whitespace-pre-wrap break-words" dir="ltr">{JSON.stringify(section.content, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Missing Data Analyzer ═══════════════ */

const EXPANSION_GUIDE = {
  "author_id": { unlocks: "includes.users", description: "يضيف بيانات الكاتب (الاسم، المعرّف، الصورة) لكل تغريدة" },
  "attachments.media_keys": { unlocks: "includes.media", description: "يضيف الوسائط المرفقة (صور، فيديو، GIF) مع التغريدات" },
  "attachments.poll_ids": { unlocks: "includes.polls", description: "يضيف بيانات التصويتات (الخيارات، الأصوات، المدة)" },
  "geo.place_id": { unlocks: "includes.places", description: "يضيف بيانات الموقع الجغرافي للتغريدات المُوسومة مكانيًا" },
  "referenced_tweets.id": { unlocks: "includes.tweets", description: "يضيف التغريدة الأصلية للردود والاقتباسات" },
  "referenced_tweets.id.author_id": { unlocks: "includes.users", description: "يضيف بيانات كاتب التغريدة المُقتبسة" },
  "in_reply_to_user_id": { unlocks: "includes.users", description: "يضيف بيانات الحساب المردود عليه" },
  "entities.mentions.username": { unlocks: "includes.users", description: "يضيف بيانات كاملة لكل حساب مذكور (@)" },
  "pinned_tweet_id": { unlocks: "includes.tweets", description: "يضيف بيانات التغريدة المثبتة عند البحث عن حسابات" },
};

const TWEET_FIELD_GUIDE = {
  "attachments": "مفاتيح المرفقات. مطلوب لتوسعات الوسائط/التصويتات.",
  "context_annotations": "تصنيفات المواضيع من X (تقنية، رياضة، إلخ).",
  "conversation_id": "معرّف سلسلة المحادثة.",
  "edit_controls": "سجل التعديلات: هل عُدّلت التغريدة.",
  "geo": "بيانات الموقع. مطلوب لتوسعة الأماكن.",
  "in_reply_to_user_id": "معرّف الحساب المردود عليه.",
  "possibly_sensitive": "هل تحتوي محتوى حساس.",
  "referenced_tweets": "التغريدات المرتبطة (رد، ريتويت، اقتباس). مهم لفهم العلاقات.",
  "reply_settings": "من يمكنه الرد: الجميع، المذكورون، أو المتابَعون.",
  "withheld": "معلومات الحجب في بلدان معينة.",
};

function MissingDataAnalyzer({ response, endpointKey, requestUrl }) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) return null;

  const isPostEndpoint = endpoint.category === "Posts" || ["user-tweets", "user-mentions"].includes(endpointKey);
  const url = requestUrl ? new URL(requestUrl) : null;
  const requestedExpansions = (url?.searchParams.get("expansions") || "").split(",").filter(Boolean);
  const requestedTweetFields = (url?.searchParams.get("tweet.fields") || "").split(",").filter(Boolean);
  const requestedUserFields = (url?.searchParams.get("user.fields") || "").split(",").filter(Boolean);
  const requestedMediaFields = (url?.searchParams.get("media.fields") || "").split(",").filter(Boolean);
  const requestedPollFields = (url?.searchParams.get("poll.fields") || "").split(",").filter(Boolean);
  const requestedPlaceFields = (url?.searchParams.get("place.fields") || "").split(",").filter(Boolean);

  const suggestions = [];

  if (isPostEndpoint && endpointKey !== "tweet-counts") {
    for (const exp of ["author_id", "attachments.media_keys", "attachments.poll_ids", "geo.place_id", "referenced_tweets.id", "referenced_tweets.id.author_id", "in_reply_to_user_id", "entities.mentions.username"]) {
      if (!requestedExpansions.includes(exp) && EXPANSION_GUIDE[exp]) {
        suggestions.push({ type: "expansion", param: "expansions", value: exp, ...EXPANSION_GUIDE[exp], severity: (exp === "attachments.media_keys" || exp === "referenced_tweets.id") ? "high" : "medium" });
      }
    }
    for (const field of ["attachments", "context_annotations", "conversation_id", "edit_controls", "geo", "in_reply_to_user_id", "possibly_sensitive", "referenced_tweets", "reply_settings", "withheld"]) {
      if (!requestedTweetFields.includes(field) && TWEET_FIELD_GUIDE[field]) {
        suggestions.push({ type: "field", param: "tweet.fields", value: field, description: TWEET_FIELD_GUIDE[field], severity: (field === "referenced_tweets" || field === "attachments") ? "high" : "low" });
      }
    }
    if (requestedExpansions.includes("attachments.media_keys") && requestedMediaFields.length === 0)
      suggestions.unshift({ type: "critical", param: "media.fields", value: "url,preview_image_url,type,width,height,alt_text", description: "لديك توسعة الوسائط لكن بدون media.fields — ستحصل على المعرّفات فقط. أضف media.fields.", severity: "critical" });
    if (requestedExpansions.includes("attachments.poll_ids") && requestedPollFields.length === 0)
      suggestions.unshift({ type: "critical", param: "poll.fields", value: "id,options,duration_minutes,end_datetime,voting_status", description: "لديك توسعة التصويتات بدون poll.fields — أضفها.", severity: "critical" });
    if (requestedExpansions.includes("geo.place_id") && requestedPlaceFields.length === 0)
      suggestions.unshift({ type: "critical", param: "place.fields", value: "full_name,country,country_code,geo,name,place_type", description: "لديك توسعة الموقع بدون place.fields — أضفها.", severity: "critical" });
  }

  if ((endpoint.category === "Users" || endpoint.category === "Account") && !["user-followers", "user-following"].includes(endpointKey)) {
    if (!requestedExpansions.includes("pinned_tweet_id") && requestedUserFields.includes("pinned_tweet_id"))
      suggestions.push({ type: "expansion", param: "expansions", value: "pinned_tweet_id", description: "طلبت pinned_tweet_id بدون توسعتها — أضفها للحصول على محتوى التغريدة المثبتة.", severity: "high", unlocks: "includes.tweets" });
  }

  const responseHints = [];
  const items = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
  for (const item of items.slice(0, 5)) {
    if (item.attachments?.media_keys && !response.includes?.media) responseHints.push("التغريدة تحتوي وسائط لكن لم تُرجع — أضف attachments.media_keys و media.fields.");
    if (item.referenced_tweets?.length > 0 && !response.includes?.tweets) responseHints.push("التغريدة تشير لأخرى لكن لم تُوسّع — أضف referenced_tweets.id.");
    if (item.author_id && !response.includes?.users) responseHints.push("التغريدات تحتوي author_id بدون بيانات الكتّاب — أضف author_id للتوسعات.");
  }
  const uniqueHints = [...new Set(responseHints)];

  if (suggestions.length === 0 && uniqueHints.length === 0) return null;
  const critical = suggestions.filter((s) => s.severity === "critical");
  const high = suggestions.filter((s) => s.severity === "high");
  const other = suggestions.filter((s) => s.severity !== "critical" && s.severity !== "high");

  return (
    <InfoCard title="بيانات يمكنك إضافتها" description="حقول وتوسعات اختيارية تُثري النتائج">
      <div className="space-y-3">
        {uniqueHints.length > 0 && uniqueHints.map((hint, i) => (
          <div key={i} className="flex items-start gap-2 p-3 bg-yellow-pale/50 border border-amber/20 rounded-[12px]">
            <span className="text-amber text-sm flex-shrink-0 font-black">!</span>
            <p className="text-xs text-text-primary font-body">{hint}</p>
          </div>
        ))}
        {critical.length > 0 && <div className="space-y-2"><p className="text-xs font-black text-brand-red">حقول ناقصة</p>{critical.map((s, i) => <SuggestionRow key={i} suggestion={s} />)}</div>}
        {high.length > 0 && <div className="space-y-2"><p className="text-xs font-black text-amber">توسعات مُوصى بها</p>{high.map((s, i) => <SuggestionRow key={i} suggestion={s} />)}</div>}
        {other.length > 0 && (
          <details className="text-xs"><summary className="text-link cursor-pointer hover:underline font-bold">{other.length} حقل اختياري إضافي</summary>
            <div className="mt-2 space-y-2">{other.map((s, i) => <SuggestionRow key={i} suggestion={s} />)}</div>
          </details>
        )}
      </div>
    </InfoCard>
  );
}

function SuggestionRow({ suggestion }) {
  const colors = { critical: "border-brand-red/30 bg-blush/30", high: "border-amber/30 bg-yellow-pale/30", medium: "border-border bg-surface-light", low: "border-border bg-surface-light" };
  return (
    <div className={`p-3 rounded-[12px] border ${colors[suggestion.severity] || colors.low}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-xs font-mono text-link bg-brand-blue/10 px-2 py-0.5 rounded-full">{suggestion.param}</code>
        <span className="text-text-muted text-[10px] font-bold">أضف:</span>
        <code className="text-xs font-mono text-text-primary bg-surface-lighter px-2 py-0.5 rounded-full" dir="ltr">{suggestion.value}</code>
        {suggestion.unlocks && <span className="text-[10px] text-brand-green font-bold">يفتح {suggestion.unlocks}</span>}
      </div>
      <p className="text-xs text-text-secondary mt-1 font-body">{suggestion.description}</p>
    </div>
  );
}

/* ═══════════════ Cost & Usage Panel ═══════════════ */

function CostUsagePanel({ meta, endpointKey, response }) {
  const endpoint = ENDPOINTS[endpointKey];
  if (!endpoint) return null;
  const rl = meta.rateLimit || {};
  const remaining = parseInt(rl.remaining), limit = parseInt(rl.limit);
  const reset = rl.reset ? new Date(parseInt(rl.reset) * 1000) : null;
  const used = !isNaN(limit) && !isNaN(remaining) ? limit - remaining : null;
  const usagePercent = !isNaN(limit) && !isNaN(remaining) ? ((limit - remaining) / limit) * 100 : null;
  const dataItems = Array.isArray(response?.data) ? response.data.length : response?.data ? 1 : 0;

  return (
    <div className="space-y-4">
      <div className="p-5 bg-surface-light rounded-[12px] space-y-3">
        <h4 className="text-sm font-black text-text-primary">حالة حصة الطلبات</h4>
        {!isNaN(limit) ? (
          <>
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div><span className="text-text-muted">مُستخدم: </span><span className="font-bold">{used}/{limit}</span></div>
              <div><span className="text-text-muted">متبقي: </span><span className={`font-bold ${remaining < limit * 0.1 ? "text-brand-red" : remaining < limit * 0.3 ? "text-amber" : "text-brand-green"}`}>{remaining}</span></div>
              {reset && <div><span className="text-text-muted">يتجدد: </span><span>{reset.toLocaleTimeString("ar-SA")}</span></div>}
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usagePercent > 90 ? "bg-brand-red" : usagePercent > 70 ? "bg-amber" : "bg-brand-green"}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
            </div>
          </>
        ) : <p className="text-xs text-text-muted font-body">لم تُرجع ترويسات حصة الطلبات.</p>}
      </div>

      <div className="p-5 bg-surface-light rounded-[12px] space-y-3">
        <h4 className="text-sm font-black text-text-primary">تكلفة هذا الطلب</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-surface rounded-[12px] shadow-card">
            <p className="text-text-muted">حصة مُستهلكة</p>
            <p className="font-display text-2xl font-black mt-1">1 طلب</p>
            <p className="text-text-muted mt-2 font-body">كل استدعاء يستهلك طلبًا واحدًا من نافذة 15 دقيقة.</p>
          </div>
          <div className="p-4 bg-surface rounded-[12px] shadow-card">
            <p className="text-text-muted">عناصر مُرجعة</p>
            <p className="font-display text-2xl font-black mt-1">{dataItems}</p>
            <p className="text-text-muted mt-2 font-body">{endpointKey === "tweet-counts" ? "واجهة الأعداد لا تستهلك حصة القراءة." : "كل تغريدة تُحسب من حصتك الشهرية (10,000 للباقة الأساسية)."}</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-surface-light rounded-[12px] space-y-3">
        <h4 className="text-sm font-black text-text-primary">باقات X API</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 bg-surface rounded-[12px] shadow-card"><p className="font-black">مجانية</p><p className="text-text-muted">1,500 كتابة/شهر</p><p className="text-text-muted">بدون قراءة</p><p className="text-[10px] mt-1">$0</p></div>
          <div className="p-4 bg-surface rounded-[12px] shadow-card border-2 border-brand-green/30"><p className="font-black text-brand-green">أساسية</p><p className="text-text-muted">10,000 قراءة/شهر</p><p className="text-text-muted">3,000 كتابة</p><p className="text-[10px] mt-1">$200</p></div>
          <div className="p-4 bg-surface rounded-[12px] shadow-card"><p className="font-black">احترافية</p><p className="text-text-muted">1M قراءة/شهر</p><p className="text-text-muted">300K كتابة</p><p className="text-[10px] mt-1">$5,000</p></div>
        </div>
        <ExplainerBox type="info" title="كيف تُحسب التغريدات؟">
          كل تغريدة في <code className="text-xs" dir="ltr">data</code> = قراءة واحدة. التوسعات لا تُحسب إضافيًا. واجهة الأعداد لا تستهلك حصة القراءة. حصة الطلبات (كل 15 دقيقة) منفصلة عن الحصة الشهرية.
        </ExplainerBox>
      </div>
    </div>
  );
}
