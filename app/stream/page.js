"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { StatusBadge, ExplainerBox, ErrorDisplay } from "../components/InfoCard";

export default function StreamPage() {
  const { token, apiFetch } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [reconnectInfo, setReconnectInfo] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const postsEndRef = useRef(null);
  const abortRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (autoScroll && !paused && postsEndRef.current) {
      postsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [posts, autoScroll, paused]);

  const connectSSE = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/stream", { signal: controller.signal })
      .then(async (response) => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);
              handleSSEMessage(data);
            } catch {
              // Ignore parse errors from heartbeats
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setTimeout(() => {
            if (!controller.signal.aborted) connectSSE();
          }, 3000);
        }
      });

    return () => controller.abort();
  }, []);

  function handleSSEMessage(data) {
    switch (data.type) {
      case "post":
        if (!pausedRef.current) {
          setPosts((prev) => {
            const updated = [...prev, data.data];
            return updated.length > 200 ? updated.slice(-200) : updated;
          });
        }
        break;
      case "status":
        setConnected(data.connected);
        setConnecting(false);
        setReconnectInfo(null);
        if (data.stats) setStats(data.stats);
        break;
      case "reconnecting":
        setConnected(false);
        setConnecting(true);
        setReconnectInfo(data);
        break;
      case "error":
        setError(data);
        setConnecting(false);
        break;
      case "stream_error":
        setError({
          message: `X API: ${data.error?.title || "خطأ غير معروف"} — ${data.error?.detail || ""}`,
        });
        break;
    }
  }

  useEffect(() => {
    const cleanup = connectSSE();
    return cleanup;
  }, [connectSSE]);

  async function handleStart() {
    if (!token) {
      setError({ message: "لم تتم إضافة مفتاح الوصول. أضفه في صفحة الإعداد.", code: "AUTH_NOT_CONFIGURED" });
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await apiFetch("/api/stream", {
        method: "POST",
        body: JSON.stringify({ action: "start", bearerToken: token }),
      });
    } catch (err) {
      setError({ message: err.message });
      setConnecting(false);
    }
  }

  async function handleStop() {
    try {
      await apiFetch("/api/stream", {
        method: "POST",
        body: JSON.stringify({ action: "stop" }),
      });
      setConnected(false);
    } catch (err) {
      setError({ message: err.message });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-4xl font-black text-text-primary flex items-center gap-3">
            البث المباشر
            {connected && <span className="w-3 h-3 rounded-full bg-brand-green animate-pulse-dot" />}
          </h1>
          <p className="font-body text-text-secondary mt-2">
            شاهد التغريدات المطابقة لقواعدك وهي تظهر لحظيًا
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <button onClick={handleStop} className="btn-danger text-sm py-2.5 px-6">
              إيقاف البث
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={connecting || !token}
              className="btn-accent disabled:opacity-40 text-sm py-2.5 px-6"
            >
              {connecting ? "جارٍ الاتصال..." : "ابدأ البث"}
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatusBadge
          status={connected ? "success" : connecting ? "warning" : "neutral"}
          label={connected ? "متصل" : connecting ? "جارٍ الاتصال..." : "غير متصل"}
        />
        {stats && (
          <>
            <span className="text-xs text-text-secondary font-bold">التغريدات: {stats.totalPosts || 0}</span>
            <span className="text-xs text-text-secondary">مكررات: {stats.duplicatesFiltered || 0}</span>
            <span className="text-xs text-text-secondary">متصلون: {stats.connectedClients || 0}</span>
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setPaused(!paused)}
          className={`px-4 py-1.5 text-xs rounded-full border font-bold transition-all-fast ${
            paused
              ? "bg-amber/15 text-amber border-amber/25"
              : "bg-surface text-text-secondary border-border hover:text-text-primary"
          }`}
        >
          {paused ? "استئناف" : "إيقاف مؤقت"}
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`px-4 py-1.5 text-xs rounded-full border font-bold transition-all-fast ${
            autoScroll
              ? "bg-brand-green/10 text-brand-green border-brand-green/20"
              : "bg-surface text-text-secondary border-border"
          }`}
        >
          تمرير تلقائي {autoScroll ? "مفعّل" : "متوقف"}
        </button>
        <button
          onClick={() => setPosts([])}
          className="px-4 py-1.5 text-xs text-text-secondary border border-border rounded-full hover:text-text-primary hover:bg-surface-light transition-all-fast font-bold"
        >
          مسح
        </button>
      </div>

      {/* Reconnection notice */}
      {reconnectInfo && (
        <div className="bg-yellow-pale/50 border border-amber/25 rounded-[12px] p-4 text-sm text-amber font-bold animate-fade-in-up">
          جارٍ إعادة الاتصال... المحاولة {reconnectInfo.attempt}/{reconnectInfo.maxAttempts}
          {reconnectInfo.reason && ` (${reconnectInfo.reason})`}
          {reconnectInfo.delayMs && ` — الانتظار ${(reconnectInfo.delayMs / 1000).toFixed(0)} ثانية`}
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorDisplay
          error={error.message}
          code={error.code}
          hint={error.code === "AUTH_NOT_CONFIGURED" ? "أضف مفتاح الوصول في صفحة الإعداد." : undefined}
          onRetry={handleStart}
        />
      )}

      {/* Posts Feed */}
      <div className="bg-surface rounded-[16px] shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">
            التغريدات {posts.length > 0 && `(${posts.length})`}
          </span>
          {paused && <StatusBadge status="warning" label="متوقف مؤقتًا" />}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {posts.length === 0 ? (
            <div className="p-14 text-center">
              {connected ? (
                <div>
                  <div className="text-4xl mb-3 opacity-20 animate-float">&#9729;</div>
                  <p className="text-text-secondary font-bold text-sm">بانتظار التغريدات...</p>
                  <p className="text-text-muted text-xs mt-2 font-body">
                    التغريدات المطابقة لقواعدك ستظهر هنا لحظة نشرها
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl mb-2 opacity-20">&#9889;</div>
                  <p className="text-text-secondary font-bold text-sm">
                    اضغط &quot;ابدأ البث&quot; لبدء استقبال التغريدات
                  </p>
                  <ExplainerBox type="info" title="قبل أن تبدأ">
                    تأكد من إضافة قاعدة واحدة على الأقل في صفحة القواعد.
                    بدون قواعد، لن تصلك أي تغريدات.
                  </ExplainerBox>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post, index) => (
                <PostCard key={post.data?.id || index} post={post} index={index} />
              ))}
              <div ref={postsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <InfoCard
        title="كيف يعمل البث المباشر؟"
        description="شرح بسيط لتدفق البيانات"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 py-4 px-4 bg-surface-light rounded-[16px] overflow-x-auto">
            <PipelineStep label="متصفحك" sub="يحفظ المفتاح" />
            <FlowDots />
            <PipelineStep label="الخادم" sub="يتصل بـ X" />
            <FlowDots />
            <PipelineStep label="X API" sub="البث المُصفّى" />
            <FlowDots />
            <PipelineStep label="هنا" sub="تظهر لحظيًا" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">تصفية المكررات</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                التغريدات المكررة تُستبعد تلقائيًا قبل وصولها لشاشتك.
              </p>
            </div>
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">إعادة اتصال ذكية</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                إذا انقطع الاتصال، الأداة تعيد الاتصال تلقائيًا بأفضل استراتيجية حسب نوع المشكلة.
              </p>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

function PostCard({ post, index }) {
  const data = post.data;
  if (!data) return null;

  const user = post.includes?.users?.find((u) => u.id === data.author_id);
  const matchingRules = post.matching_rules || [];

  return (
    <div className="p-5 hover:bg-surface-light/50 transition-all-fast animate-tweet-enter opacity-0" style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}>
      <div className="flex items-center gap-3 mb-2">
        {user?.profile_image_url && (
          <img src={user.profile_image_url} alt={user.name} className="w-10 h-10 rounded-full" />
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {user ? (
            <>
              <span className="font-bold text-sm text-text-primary">{user.name}</span>
              <span className="text-text-secondary text-sm" dir="ltr">@{user.username}</span>
              {user.verified_type && <StatusBadge status="info" label={user.verified_type} />}
            </>
          ) : (
            <span className="text-text-secondary text-sm" dir="ltr">User {data.author_id}</span>
          )}
        </div>
        <span className="text-xs text-text-muted mr-auto" dir="ltr">
          {data.created_at ? new Date(data.created_at).toLocaleTimeString("ar-SA") : ""}
        </span>
      </div>

      <p className="text-sm text-text-primary whitespace-pre-wrap break-words font-body leading-relaxed">{data.text}</p>

      <div className="flex items-center gap-5 mt-3 text-xs text-text-secondary">
        {data.public_metrics && (
          <>
            <span>{"\u2665"} {data.public_metrics.like_count}</span>
            <span>{"\u21bb"} {data.public_metrics.retweet_count}</span>
            <span>&#128172; {data.public_metrics.reply_count}</span>
          </>
        )}
        {data.lang && <span className="text-text-muted">{data.lang}</span>}
      </div>

      {matchingRules.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs text-text-muted">طابقت:</span>
          {matchingRules.map((rule) => (
            <span key={rule.id} className="text-xs highlight-green font-bold">
              {rule.tag || rule.id}
            </span>
          ))}
        </div>
      )}

      {data.entities?.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.entities.hashtags.map((h, i) => (
            <span key={i} className="text-xs text-link font-bold">#{h.tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PipelineStep({ label, sub }) {
  return (
    <div className="text-center px-4 py-2.5 bg-surface rounded-[12px] shadow-card flex-shrink-0">
      <div className="font-bold text-text-primary text-xs">{label}</div>
      <div className="text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function FlowDots() {
  return (
    <div className="flex gap-0.5 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow" />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow delay-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow delay-2" />
    </div>
  );
}
