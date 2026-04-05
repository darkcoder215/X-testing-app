"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "./components/AuthProvider";
import InfoCard, { StatusBadge, ExplainerBox } from "./components/InfoCard";

export default function DashboardPage() {
  const { token, apiFetch, loaded } = useAuth();
  const [status, setStatus] = useState({
    auth: { loading: true, configured: false },
    rules: { loading: true, count: 0 },
    stream: { loading: true, connected: false },
  });

  useEffect(() => {
    if (!loaded) return;
    const hasToken = Boolean(token);

    if (!hasToken) {
      setStatus({
        auth: { loading: false, configured: false },
        rules: { loading: false, count: 0 },
        stream: { loading: false, connected: false },
      });
      return;
    }

    Promise.allSettled([
      apiFetch("/api/auth").then((r) => r.json()),
      apiFetch("/api/rules").then((r) => r.json()),
      apiFetch("/api/stream", {
        method: "POST",
        body: JSON.stringify({ action: "status" }),
      }).then((r) => r.json()),
    ]).then(([authRes, rulesRes, streamRes]) => {
      setStatus({
        auth: {
          loading: false,
          configured: authRes.status === "fulfilled" && authRes.value.configured,
        },
        rules: {
          loading: false,
          count: rulesRes.status === "fulfilled" ? (rulesRes.value.rules?.length || 0) : 0,
          error: rulesRes.status === "fulfilled" ? rulesRes.value.error : null,
        },
        stream: {
          loading: false,
          connected: streamRes.status === "fulfilled" && streamRes.value.connected,
          stats: streamRes.status === "fulfilled" ? streamRes.value.stats : null,
        },
      });
    });
  }, [loaded, token, apiFetch]);

  const allConfigured = status.auth.configured && status.rules.count > 0;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl font-black text-text-primary">الرئيسية</h1>
        <p className="font-body text-text-secondary mt-2 text-base">
          نظرة شاملة على حالة أداة تحليل التغريدات ومتابعتها لحظيًا
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatusCard
          title="التوثيق"
          subtitle="ربط حسابك"
          loading={status.auth.loading}
          configured={status.auth.configured}
          configuredLabel="تم الربط"
          notConfiguredLabel="لم يتم الربط بعد"
          href="/rules"
          linkLabel="إدارة القواعد"
          color="green"
          delay="delay-1"
        />
        <StatusCard
          title="قواعد التصفية"
          subtitle="ماذا تريد متابعته؟"
          loading={status.rules.loading}
          configured={status.rules.count > 0}
          configuredLabel={`${status.rules.count} قاعدة نشطة`}
          notConfiguredLabel={status.rules.error ? "خطأ في التحميل" : "لا توجد قواعد"}
          href="/rules"
          linkLabel="إدارة القواعد"
          color="blue"
          delay="delay-2"
        />
        <StatusCard
          title="البث المباشر"
          subtitle="التغريدات لحظيًا"
          loading={status.stream.loading}
          configured={status.stream.connected}
          configuredLabel="متصل الآن"
          notConfiguredLabel="غير متصل"
          href="/stream"
          linkLabel="شاهد البث"
          color="amber"
          delay="delay-3"
        />
      </div>

      {/* Flying Tweets Decoration + Getting Started */}
      {!allConfigured && (
        <div className="relative">
          {/* Flying tweet decorations */}
          <FlyingTweets />

          <InfoCard
            title="ابدأ الآن"
            description="ثلاث خطوات بسيطة لتبدأ متابعة التغريدات التي تهمك"
            green
          >
            <div className="space-y-5">
              <ExplainerBox type="tip" title="لا تحتاج أي إعدادات تقنية معقدة!">
                كل ما تحتاجه هو مفتاح من منصة X للمطورين. تلصقه هنا مرة واحدة
                ويُحفظ في متصفحك — لا حاجة لإعدادات خوادم أو متغيرات بيئية.
              </ExplainerBox>

              <Step
                number={1}
                title="أضف مفتاح الوصول"
                description="احصل على Bearer Token من بوابة X للمطورين. فكّر فيه كمفتاح يعطيك صلاحية قراءة التغريدات."
                done={status.auth.configured}
                href="/rules"
              />
              <Step
                number={2}
                title="حدد قواعد المتابعة"
                description='القواعد تحدد أي التغريدات تصلك. مثلًا: "#تقنية lang:ar" تعني أنك تريد التغريدات العربية عن التقنية.'
                done={status.rules.count > 0}
                href="/rules"
              />
              <Step
                number={3}
                title="ابدأ البث المباشر"
                description="اضغط تشغيل وشاهد التغريدات المطابقة لقواعدك وهي تظهر أمامك لحظة بلحظة، كأنك تشاهد بثًا مباشرًا."
                done={status.stream.connected}
                href="/stream"
              />
            </div>
          </InfoCard>
        </div>
      )}

      {/* How It Works — Non-technical pipeline */}
      <InfoCard
        title="كيف تعمل الأداة؟"
        description="شرح مبسط للآلية من البداية للنهاية"
      >
        <div className="space-y-5">
          <ExplainerBox type="info" title="ما هو البث المُصفّى؟">
            تخيّل أنك تجلس أمام شاشة تعرض كل تغريدات العالم. البث المُصفّى يتيح لك
            أن تختار فقط التغريدات التي تهمك — كأنك وضعت فلتر على هذه الشاشة.
            بدلًا من البحث يدويًا، التغريدات تأتيك تلقائيًا لحظة نشرها.
          </ExplainerBox>

          {/* Animated Pipeline */}
          <div className="flex items-center gap-2 py-5 px-4 bg-surface-light rounded-[16px] overflow-x-auto">
            <PipelineStep label="قواعدك" sublabel="ماذا تريد؟" icon="filter" />
            <AnimatedArrow />
            <PipelineStep label="منصة X" sublabel="تبحث لك" icon="search" />
            <AnimatedArrow />
            <PipelineStep label="البث" sublabel="ترسل لحظيًا" icon="stream" />
            <AnimatedArrow />
            <PipelineStep label="هنا" sublabel="تظهر أمامك" icon="display" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">القواعد (حتى 1,000 قاعدة)</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                حدد كلمات مفتاحية، هاشتاقات، حسابات معينة، أو لغات محددة.
                كل قاعدة تعمل بشكل مستقل — إذا تغريدة طابقت أي قاعدة، ستصلك.
              </p>
            </div>
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">اتصال مستمر</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                الأداة تحافظ على اتصال دائم مع X. إذا انقطع الاتصال لأي سبب،
                تعيد الاتصال تلقائيًا. لا تحتاج أن تفعل شيئًا.
              </p>
            </div>
          </div>

          {/* Conclusion Box */}
          <div className="p-4 bg-brand-green-light/30 rounded-[12px] border border-brand-green/20">
            <p className="font-bold text-brand-green text-sm mb-1">الخلاصة</p>
            <p className="text-text-primary text-sm font-body leading-relaxed">
              الأداة تعمل كمراقب ذكي — تحدد لها ما يهمك، وهي تجمع لك
              التغريدات المطابقة لحظة نشرها. مفيدة لمتابعة الأحداث، رصد
              المنافسين، تحليل الرأي العام، أو أي شيء يحدث على X.
            </p>
          </div>
        </div>
      </InfoCard>

      {/* Stream Stats (if connected) */}
      {status.stream.stats && status.stream.stats.totalPosts > 0 && (
        <InfoCard title="إحصائيات البث">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat label="إجمالي التغريدات" value={status.stream.stats.totalPosts} />
            <Stat label="مكررات تم تصفيتها" value={status.stream.stats.duplicatesFiltered} />
            <Stat label="متصلون الآن" value={status.stream.stats.connectedClients} />
            <Stat label="مدة الاتصال" value={formatUptime(status.stream.stats.uptime)} />
          </div>
        </InfoCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Flying Tweets — decorative animated tweet snippets
   ═══════════════════════════════════════════════════════ */
function FlyingTweets() {
  const tweets = [
    { text: "تقنية #AI", x: "5%", delay: "0s", duration: "7s" },
    { text: "#بث_مباشر", x: "25%", delay: "1.5s", duration: "8s" },
    { text: "تحليل البيانات", x: "50%", delay: "3s", duration: "6s" },
    { text: "#Yaman", x: "75%", delay: "0.8s", duration: "9s" },
    { text: "رصد لحظي", x: "90%", delay: "2.5s", duration: "7.5s" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
      {tweets.map((t, i) => (
        <div
          key={i}
          className="absolute bottom-0 opacity-0"
          style={{
            right: t.x,
            animation: `fly-up ${t.duration} ease-in-out ${t.delay} infinite`,
          }}
        >
          <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-[12px] px-3 py-2 shadow-card text-xs text-text-secondary whitespace-nowrap">
            {t.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusCard({ title, subtitle, loading, configured, configuredLabel, notConfiguredLabel, href, linkLabel, color, delay }) {
  const borderColors = {
    green: "border-t-brand-green",
    blue: "border-t-brand-blue",
    amber: "border-t-amber",
  };

  return (
    <div className={`animate-fade-in-up opacity-0 ${delay} bg-surface rounded-[16px] shadow-card hover:shadow-card-hover transition-all-fast p-5 border-t-[3px] ${borderColors[color]}`}>
      <div className="mb-3">
        <h3 className="font-bold text-text-primary text-sm">{title}</h3>
        <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
      </div>
      <div className="mb-3">
        {loading ? (
          <div className="h-6 w-24 rounded-full animate-shimmer" />
        ) : (
          <StatusBadge
            status={configured ? "success" : "warning"}
            label={configured ? configuredLabel : notConfiguredLabel}
          />
        )}
      </div>
      <Link
        href={href}
        className="text-sm text-link hover:underline font-bold transition-all-fast"
      >
        {linkLabel} &larr;
      </Link>
    </div>
  );
}

function Step({ number, title, description, done, href }) {
  return (
    <div className="flex gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: `${number * 0.15}s` }}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
        done ? "bg-brand-green/20 text-brand-green" : "bg-surface-lighter text-text-secondary"
      }`}>
        {done ? "\u2713" : number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold ${done ? "text-brand-green" : "text-text-primary"}`}>{title}</h3>
          {done && <StatusBadge status="success" label="تم" />}
        </div>
        <p className="text-sm text-text-secondary mt-1 font-body leading-relaxed">{description}</p>
        {!done && (
          <Link href={href} className="text-sm text-link hover:underline font-bold mt-2 inline-block">
            {title} &larr;
          </Link>
        )}
      </div>
    </div>
  );
}

function PipelineStep({ label, sublabel, icon }) {
  const icons = {
    filter: "\u2726",
    search: "\u2315",
    stream: "\u26A1",
    display: "\u25C9",
  };

  return (
    <div className="text-center px-4 py-3 bg-surface rounded-[12px] shadow-card flex-shrink-0 min-w-[90px]">
      <div className="text-xl mb-1">{icons[icon]}</div>
      <div className="font-bold text-text-primary text-sm">{label}</div>
      <div className="text-[11px] text-text-secondary">{sublabel}</div>
    </div>
  );
}

function AnimatedArrow() {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow" />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow delay-1" />
      <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-flow delay-2" />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center p-3 bg-surface-light rounded-[12px]">
      <div className="font-display text-3xl font-black text-text-primary animate-score">{value}</div>
      <div className="text-xs text-text-secondary mt-1 font-bold">{label}</div>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds || seconds === 0) return "0 ث";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} س ${m} د`;
  if (m > 0) return `${m} د ${s} ث`;
  return `${s} ث`;
}
