"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { StatusBadge, ErrorDisplay } from "../components/InfoCard";

// Official X API pay-per-use pricing
const PRICING = {
  "posts_read":       { cost: 0.005, unit: "تغريدة",  label: "قراءة تغريدات" },
  "user_read":        { cost: 0.010, unit: "حساب",   label: "قراءة حسابات" },
  "followers_read":   { cost: 0.010, unit: "متابع",  label: "قراءة متابعين" },
  "counts_recent":    { cost: 0.005, unit: "طلب",    label: "عدد التغريدات (أخير)" },
  "counts_all":       { cost: 0.010, unit: "طلب",    label: "عدد التغريدات (كامل)" },
  "dm_read":          { cost: 0.010, unit: "رسالة",  label: "قراءة رسائل" },
  "content_create":   { cost: 0.010, unit: "طلب",    label: "إنشاء محتوى" },
  "dm_create":        { cost: 0.015, unit: "طلب",    label: "إنشاء رسالة" },
  "user_interaction":  { cost: 0.015, unit: "طلب",    label: "تفاعل (متابعة/إعجاب)" },
};
const COST_PER_TWEET = PRICING.posts_read.cost; // $0.005

export default function ExtractorPage() {
  const { token, apiFetch } = useAuth();

  // Search params
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxTweets, setMaxTweets] = useState(500);

  // Extraction state
  const [extracting, setExtracting] = useState(false);
  const [tweets, setTweets] = useState([]);
  const [includes, setIncludes] = useState({ users: [], media: [] });
  const [progress, setProgress] = useState({ fetched: 0, total: null, pages: 0 });
  const [error, setError] = useState(null);
  const [useRecent, setUseRecent] = useState(false);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const canStart = query.trim() && token && !extracting;

  // Cost calculator — official pay-per-use pricing
  // Tweet reads at $0.005 each (expansions included in this cost)
  const totalCost = (maxTweets * COST_PER_TWEET).toFixed(2);

  const startExtraction = useCallback(async () => {
    if (!canStart) return;
    setExtracting(true);
    setTweets([]);
    setIncludes({ users: [], media: [] });
    setProgress({ fetched: 0, total: null, pages: 0 });
    setError(null);
    setDone(false);
    abortRef.current = false;

    let allTweets = [];
    let allUsers = [];
    let allMedia = [];
    let nextToken = null;
    let pages = 0;
    let fallbackToRecent = useRecent;

    try {
      while (allTweets.length < maxTweets && !abortRef.current) {
        const body = {
          query: query.trim(),
          max_results: Math.min(100, maxTweets - allTweets.length),
          next_token: nextToken,
          use_recent: fallbackToRecent,
        };
        if (startDate) body.start_time = new Date(startDate).toISOString();
        if (endDate) body.end_time = new Date(endDate).toISOString();

        const res = await apiFetch("/api/extract", {
          method: "POST",
          body: JSON.stringify(body),
        });
        const result = await res.json();

        // Handle fallback to recent
        if (result.code === "FALLBACK_TO_RECENT") {
          fallbackToRecent = true;
          setUseRecent(true);
          continue;
        }

        if (result.error) {
          setError(result);
          break;
        }

        const newTweets = result.data || [];
        allTweets = [...allTweets, ...newTweets];
        allUsers = [...allUsers, ...(result.includes?.users || [])];
        allMedia = [...allMedia, ...(result.includes?.media || [])];
        pages++;

        setTweets([...allTweets]);
        setIncludes({
          users: dedupeById(allUsers),
          media: dedupeByKey(allMedia),
        });
        setProgress({
          fetched: allTweets.length,
          total: result.meta?.result_count || null,
          pages,
        });

        nextToken = result.meta?.next_token;
        if (!nextToken) break;

        // Rate limit safety: wait between pages
        if (result.rateLimit?.remaining && parseInt(result.rateLimit.remaining) < 5) {
          setError({ error: "اقتربت من حد الطلبات. انتظر قليلًا ثم أعد المحاولة.", code: "RATE_LIMIT_WARNING" });
          break;
        }

        // Small delay between pages
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      setError({ error: err.message, code: "NETWORK_ERROR" });
    } finally {
      setExtracting(false);
      setDone(true);
    }
  }, [canStart, query, startDate, endDate, maxTweets, useRecent, token, apiFetch]);

  const stopExtraction = () => {
    abortRef.current = true;
  };

  const downloadCSV = useCallback(() => {
    if (tweets.length === 0) return;
    const userMap = {};
    for (const u of includes.users) userMap[u.id] = u;

    const headers = [
      "id", "text", "created_at", "lang", "source",
      "author_id", "author_name", "author_username", "author_verified",
      "author_followers", "author_following", "author_tweets",
      "like_count", "retweet_count", "reply_count", "quote_count",
      "impression_count", "bookmark_count",
      "conversation_id", "in_reply_to_user_id",
      "is_retweet", "is_reply", "is_quote",
      "hashtags", "mentions", "urls",
      "possibly_sensitive", "reply_settings",
    ];

    const rows = tweets.map((t) => {
      const author = userMap[t.author_id] || {};
      const pm = t.public_metrics || {};
      const refs = t.referenced_tweets || [];
      const entities = t.entities || {};

      return [
        t.id,
        `"${(t.text || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        t.created_at || "",
        t.lang || "",
        t.source || "",
        t.author_id || "",
        `"${(author.name || "").replace(/"/g, '""')}"`,
        author.username || "",
        author.verified_type || "",
        author.public_metrics?.followers_count ?? "",
        author.public_metrics?.following_count ?? "",
        author.public_metrics?.tweet_count ?? "",
        pm.like_count ?? "",
        pm.retweet_count ?? "",
        pm.reply_count ?? "",
        pm.quote_count ?? "",
        pm.impression_count ?? "",
        pm.bookmark_count ?? "",
        t.conversation_id || "",
        t.in_reply_to_user_id || "",
        refs.some((r) => r.type === "retweeted") ? "TRUE" : "FALSE",
        refs.some((r) => r.type === "replied_to") ? "TRUE" : "FALSE",
        refs.some((r) => r.type === "quoted") ? "TRUE" : "FALSE",
        `"${(entities.hashtags || []).map((h) => h.tag).join(", ")}"`,
        `"${(entities.mentions || []).map((m) => m.username).join(", ")}"`,
        `"${(entities.urls || []).map((u) => u.expanded_url || u.url).join(", ")}"`,
        t.possibly_sensitive ? "TRUE" : "FALSE",
        t.reply_settings || "",
      ].join(",");
    });

    // BOM for Arabic support in Excel
    const bom = "\uFEFF";
    const csv = bom + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tweets_${query.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tweets, includes, query]);

  const progressPercent = maxTweets > 0 ? Math.min((progress.fetched / maxTweets) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl font-black text-text-primary">استخراج البيانات</h1>
        <p className="font-body text-text-secondary mt-2 text-base">
          ابحث في تغريدات X واستخرجها كملف CSV مع جميع البيانات
        </p>
      </div>

      <div className="flex gap-6">
        {/* Main Panel */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Search Box */}
          <div className="bg-surface rounded-[16px] shadow-card p-5 space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canStart && startExtraction()}
                placeholder='ابحث... (مثال: #AI lang:en -is:retweet)'
                dir="ltr"
                className="w-full px-5 py-4 bg-surface-light border-2 border-border rounded-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-black focus:ring-2 focus:ring-brand-black/10 text-sm font-mono"
              />
            </div>

            {/* Date filters */}
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-[11px] font-bold text-text-secondary mb-1.5 block">من تاريخ</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  dir="ltr"
                  className="px-3 py-1.5 bg-surface-light border border-border rounded-[10px] text-xs text-text-primary focus:outline-none focus:border-brand-black font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-text-secondary mb-1.5 block">إلى تاريخ</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  dir="ltr"
                  className="px-3 py-1.5 bg-surface-light border border-border rounded-[10px] text-xs text-text-primary focus:outline-none focus:border-brand-black font-mono"
                />
              </div>

              {/* Max tweets */}
              <div>
                <label className="text-[11px] font-bold text-text-secondary mb-1.5 block">الحد الأقصى</label>
                <div className="flex gap-1">
                  {[100, 500, 1000, 5000, 10000].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxTweets(n)}
                      className={`px-2.5 py-1.5 text-[11px] rounded-full font-bold font-mono transition-all-fast ${
                        maxTweets === n
                          ? "bg-brand-black text-white"
                          : "bg-surface-light text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {n.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search type toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setUseRecent(false)}
                className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all-fast ${
                  !useRecent ? "bg-brand-black text-white" : "bg-surface-light text-text-muted"
                }`}
              >
                الأرشيف الكامل
              </button>
              <button
                onClick={() => setUseRecent(true)}
                className={`px-3 py-1.5 text-xs rounded-full font-bold transition-all-fast ${
                  useRecent ? "bg-brand-black text-white" : "bg-surface-light text-text-muted"
                }`}
              >
                آخر 7 أيام
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              {!extracting ? (
                <button
                  onClick={startExtraction}
                  disabled={!canStart}
                  className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed px-6"
                >
                  ابدأ الاستخراج
                </button>
              ) : (
                <button onClick={stopExtraction} className="btn-primary px-6">
                  إيقاف
                </button>
              )}
              {tweets.length > 0 && (
                <button onClick={downloadCSV} className="btn-secondary px-6">
                  تحميل CSV ({tweets.length.toLocaleString()} تغريدة)
                </button>
              )}
              {!token && <span className="text-xs text-text-muted font-bold">أضف مفتاح الوصول أولًا</span>}
            </div>
          </div>

          {/* Progress */}
          {(extracting || done) && (
            <div className="bg-surface rounded-[16px] shadow-card p-5 space-y-3 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-text-primary">
                  {extracting ? "جارٍ الاستخراج..." : "اكتمل الاستخراج"}
                </h3>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{progress.fetched.toLocaleString()} تغريدة</span>
                  <span>{progress.pages} صفحة</span>
                  {extracting && <span className="animate-pulse-dot inline-block w-2 h-2 rounded-full bg-brand-black" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-surface-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-black rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted font-mono">
                <span>{progress.fetched.toLocaleString()} / {maxTweets.toLocaleString()}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="animate-fade-in-up">
              <ErrorDisplay error={error.error} code={error.code} />
            </div>
          )}

          {/* Preview */}
          {tweets.length > 0 && (
            <InfoCard title="معاينة" description={`آخر ${Math.min(5, tweets.length)} تغريدات من ${tweets.length.toLocaleString()}`}>
              <div className="divide-y divide-border">
                {tweets.slice(-5).reverse().map((t) => {
                  const author = includes.users.find((u) => u.id === t.author_id);
                  return (
                    <div key={t.id} className="py-3">
                      <div className="flex items-center gap-2 mb-1">
                        {author?.profile_image_url && <img src={author.profile_image_url} alt="" className="w-6 h-6 rounded-full" />}
                        <span className="text-xs font-bold text-text-primary">{author?.name}</span>
                        <span className="text-[10px] text-text-muted" dir="ltr">@{author?.username}</span>
                        <span className="text-[10px] text-text-muted mr-auto">{t.created_at ? new Date(t.created_at).toLocaleString("ar-SA") : ""}</span>
                      </div>
                      <p className="text-xs text-text-primary font-body line-clamp-2">{t.text}</p>
                      {t.public_metrics && (
                        <div className="flex gap-4 mt-1 text-[10px] text-text-muted">
                          <span>{"\u2665"} {t.public_metrics.like_count?.toLocaleString()}</span>
                          <span>{"\u21bb"} {t.public_metrics.retweet_count?.toLocaleString()}</span>
                          <span>&#128172; {t.public_metrics.reply_count?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Collapsible JSON */}
              <CollapsibleJSON data={tweets.slice(0, 3)} label={`JSON عيّنة (${Math.min(3, tweets.length)} تغريدات)`} />
            </InfoCard>
          )}
        </div>

        {/* Cost Calculator Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-surface rounded-[16px] shadow-card p-5 sticky top-8 space-y-5">
            <h3 className="font-display text-sm font-black text-text-primary">حاسبة التكلفة</h3>

            {/* Quick calculator */}
            <div>
              <label className="text-[11px] font-bold text-text-secondary mb-1.5 block">عدد التغريدات</label>
              <input
                type="number"
                value={maxTweets}
                onChange={(e) => setMaxTweets(Math.max(10, parseInt(e.target.value) || 10))}
                dir="ltr"
                className="w-full px-3 py-2 bg-surface-light border border-border rounded-[10px] text-sm text-text-primary font-mono focus:outline-none focus:border-brand-black"
              />
            </div>

            {/* Total estimate */}
            <div className="p-4 bg-brand-black rounded-[12px] text-white">
              <p className="text-[10px] font-bold opacity-70">التكلفة التقديرية</p>
              <p className="font-display text-2xl font-black mt-1">${totalCost}</p>
              <p className="text-[10px] opacity-60 mt-1">لـ {maxTweets.toLocaleString()} تغريدة</p>
            </div>

            {/* Breakdown */}
            <div className="p-3 bg-surface-light rounded-[12px] space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">قراءة تغريدات</span>
                <span className="font-mono font-bold">${totalCost}</span>
              </div>
              <div className="text-[10px] text-text-muted">
                {maxTweets.toLocaleString()} تغريدة x ${COST_PER_TWEET}
              </div>
              <p className="text-[10px] text-text-muted pt-1 border-t border-border mt-1">التوسعات (الكاتب، الوسائط) مشمولة بتكلفة القراءة</p>
            </div>

            {/* Official pricing table */}
            <div>
              <p className="text-[11px] font-bold text-text-secondary mb-2">أسعار X API الرسمية</p>
              <div className="space-y-1">
                {Object.values(PRICING).map((p) => (
                  <div key={p.label} className="flex justify-between text-[10px] py-1 border-b border-border last:border-0">
                    <span className="text-text-muted">{p.label}</span>
                    <span className="font-mono text-text-primary font-bold">${p.cost}/{p.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's in the CSV */}
            <div>
              <p className="text-[11px] font-bold text-text-secondary mb-2">حقول الملف</p>
              <div className="space-y-1 text-[10px] text-text-muted">
                <p>النص، التاريخ، اللغة، المصدر</p>
                <p>الكاتب، المعرّف، المتابعين</p>
                <p>الإعجابات، الريتويت، الردود</p>
                <p>المشاهدات، الاقتباسات، الحفظ</p>
                <p>الهاشتاقات، الإشارات، الروابط</p>
                <p>نوع التغريدة (رد، ريتويت، اقتباس)</p>
                <p>محتوى حساس، إعدادات الرد</p>
              </div>
            </div>

            {/* Timeline visual */}
            {startDate && endDate && (
              <div>
                <p className="text-[11px] font-bold text-text-secondary mb-2">النطاق الزمني</p>
                <div className="relative">
                  <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
                    <div className="h-full bg-brand-black rounded-full" style={{ width: "100%" }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-text-muted font-mono" dir="ltr">
                    <span>{new Date(startDate).toLocaleDateString()}</span>
                    <span>{new Date(endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Helpers ═══════════════ */

function dedupeById(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function dedupeByKey(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = item.media_key || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function CollapsibleJSON({ data, label }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold text-link hover:underline transition-all-fast"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>&#9654;</span>
        {open ? "إخفاء" : "عرض"} {label}
      </button>
      {open && (
        <pre className="mt-3 bg-dark-slate p-4 rounded-[12px] text-xs text-text-on-dark font-mono overflow-auto max-h-[400px] whitespace-pre-wrap break-words" dir="ltr">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
