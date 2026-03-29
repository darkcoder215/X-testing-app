"use client";

import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";

export default function SetupPage() {
  const { token, setToken, clearToken, apiFetch } = useAuth();
  const [inputToken, setInputToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  async function handleValidateAndSave(e) {
    e.preventDefault();
    if (!inputToken.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearerToken: inputToken.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setToken(inputToken.trim());
        setInputToken("");
        setResult({ ...data, saved: true });
      } else {
        setResult(data);
      }
    } catch (error) {
      setResult({
        valid: false,
        message: "خطأ في الشبكة. تأكد من اتصالك بالإنترنت.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setValidating(false);
    }
  }

  async function handleTestCurrent() {
    if (!token) return;
    setValidating(true);
    setResult(null);

    try {
      const res = await apiFetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ valid: false, message: error.message, code: "NETWORK_ERROR" });
    } finally {
      setValidating(false);
    }
  }

  function handleRemoveToken() {
    if (!confirm("هل تريد حذف مفتاح الوصول من هذا المتصفح؟")) return;
    clearToken();
    setResult(null);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl font-black text-text-primary">الإعداد</h1>
        <p className="font-body text-text-secondary mt-2 text-base">
          اربط حسابك بالأداة — خطوة واحدة بسيطة ولا تحتاج أي خبرة تقنية
        </p>
      </div>

      {/* Current Status */}
      <InfoCard title="الحالة الحالية" description="مفتاح الوصول محفوظ في متصفحك فقط">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge
              status={token ? "success" : "warning"}
              label={token ? "المفتاح محفوظ ويعمل" : "لم يتم إضافة مفتاح بعد"}
            />
            {token && (
              <span className="text-xs text-text-secondary font-mono" dir="ltr">
                {token.substring(0, 10)}...{token.substring(token.length - 6)}
              </span>
            )}
          </div>

          {token && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestCurrent}
                disabled={validating}
                className="btn-secondary text-xs py-2 px-4"
              >
                {validating ? "جارٍ الاختبار..." : "اختبر المفتاح الحالي"}
              </button>
              <button
                onClick={handleRemoveToken}
                className="px-4 py-2 text-xs text-brand-red border border-brand-red/20 rounded-full hover:bg-brand-red/10 transition-all-fast font-bold"
              >
                حذف المفتاح
              </button>
            </div>
          )}
        </div>
      </InfoCard>

      {/* How it works — simplified */}
      <InfoCard
        title="كيف يعمل الربط؟"
        description="شرح مبسط لآلية التوثيق"
      >
        <div className="space-y-4">
          <ExplainerBox type="tip" title="لا تحتاج أي إعدادات خادم!">
            المفتاح يُحفظ في متصفحك فقط. عندما تطلب بيانات من X، المتصفح يرسل المفتاح
            مع الطلب. الخادم يمرره لـ X ثم يعيد لك النتيجة. لا شيء يُخزّن على الخادم.
          </ExplainerBox>

          {/* Visual flow — RTL */}
          <div className="flex items-center gap-3 py-4 px-4 bg-surface-light rounded-[16px] overflow-x-auto">
            <FlowStep label="متصفحك" sub="يحفظ المفتاح" />
            <FlowArrow label="يرسله مع كل طلب" />
            <FlowStep label="الخادم" sub="يمرره فقط" />
            <FlowArrow label="يوثق الطلب" />
            <FlowStep label="منصة X" sub="ترد بالبيانات" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">أين يُحفظ المفتاح؟</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                في ذاكرة المتصفح المحلية (localStorage). يبقى حتى لو أغلقت المتصفح.
                إذا استخدمت متصفحًا آخر أو جهازًا آخر، ستحتاج إدخاله مرة أخرى.
              </p>
            </div>
            <div className="p-4 bg-surface-light rounded-[12px]">
              <p className="font-bold text-text-primary text-sm">هل هذا آمن؟</p>
              <p className="text-text-secondary text-xs mt-2 font-body leading-relaxed">
                نعم للاستخدام الشخصي. المفتاح لا يمكن لأي موقع آخر الوصول إليه.
                ويُرسل عبر اتصال مشفر (HTTPS). لا يُخزّن أبدًا على الخادم.
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Add/Update Token */}
      <InfoCard
        title={token ? "تحديث مفتاح الوصول" : "إضافة مفتاح الوصول"}
        description="الصق المفتاح أدناه — سيتم التحقق منه ثم حفظه في متصفحك"
      >
        <form onSubmit={handleValidateAndSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Bearer Token
            </label>
            <input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="AAAAAAAAAAAAAAAAAAA..."
              dir="ltr"
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm font-mono"
            />
            <p className="text-xs text-text-secondary mt-2 font-body">
              سيتم التحقق من صلاحية المفتاح عبر X API ثم حفظه في متصفحك.
              المفتاح لا يخرج من متصفحك إلا مع طلبات البيانات.
            </p>
          </div>

          <button
            type="submit"
            disabled={validating || !inputToken.trim()}
            className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {validating ? "جارٍ التحقق..." : "تحقق واحفظ"}
          </button>

          {result && (
            <div className="mt-4 animate-fade-in-up">
              {result.valid ? (
                <div className="bg-brand-green-light/30 border border-brand-green/20 rounded-[12px] p-4 flex items-start gap-3">
                  <span className="text-brand-green text-lg">&#10003;</span>
                  <div className="font-body">
                    <p className="text-brand-green font-bold text-sm">{result.message}</p>
                    {result.saved && (
                      <p className="text-text-secondary text-xs mt-1">
                        تم حفظ المفتاح في متصفحك. يمكنك الآن إدارة القواعد وبدء البث.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ErrorDisplay
                  error={result.message}
                  code={result.code}
                  hint={result.status === 429 ? "انتظر دقيقة ثم حاول مرة أخرى." : undefined}
                />
              )}
            </div>
          )}
        </form>
      </InfoCard>

      {/* How to get a token — non-technical */}
      <InfoCard
        title="كيف تحصل على مفتاح الوصول؟"
        description="دليل خطوة بخطوة — لا يحتاج خبرة برمجية"
      >
        <div className="space-y-5">
          <ExplainerBox type="info" title="ما هو Bearer Token؟">
            فكّر فيه كـ &quot;بطاقة دخول&quot; تسمح لهذه الأداة بقراءة التغريدات نيابة عنك.
            هو مرتبط بتطبيقك على منصة X للمطورين، وليس بحسابك الشخصي مباشرة.
          </ExplainerBox>

          <ol className="space-y-4">
            <GuideStep
              number={1}
              title="أنشئ حساب مطور"
              description="سجّل في بوابة X للمطورين. هذا مجاني ويستغرق دقائق قليلة."
              link="https://developer.x.com/en/portal/petition/essential/basic-info"
              linkLabel="developer.x.com"
            />
            <GuideStep
              number={2}
              title="أنشئ مشروعًا وتطبيقًا"
              description='في لوحة التحكم، أنشئ مشروعًا جديدًا ثم أنشئ تطبيقًا داخله. سمّه أي اسم تريد.'
              link="https://developer.x.com/en/portal/dashboard"
              linkLabel="لوحة التحكم"
            />
            <GuideStep
              number={3}
              title="انسخ المفتاح"
              description='اذهب لصفحة "Keys and Tokens" في تطبيقك وانسخ Bearer Token. ستراه مرة واحدة فقط — احفظه.'
            />
            <GuideStep
              number={4}
              title="الصقه هنا"
              description="ارجع لهذه الصفحة، الصق المفتاح في الحقل أعلاه، واضغط تحقق واحفظ. هذا كل شيء!"
            />
          </ol>

          {/* Conclusion */}
          <div className="p-4 bg-brand-green-light/30 rounded-[12px] border border-brand-green/20">
            <p className="font-bold text-brand-green text-sm mb-1">الخلاصة</p>
            <p className="text-text-primary text-sm font-body leading-relaxed">
              المفتاح يُنشأ مرة واحدة ويُستخدم للأبد (ما لم تلغيه). بمجرد إضافته هنا،
              الأداة جاهزة للعمل. كل ما تحتاجه بعد ذلك هو إضافة قواعد التصفية.
            </p>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

function FlowStep({ label, sub }) {
  return (
    <div className="text-center px-4 py-2 bg-surface rounded-[12px] shadow-card flex-shrink-0">
      <div className="font-bold text-text-primary text-xs">{label}</div>
      <div className="text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function FlowArrow({ label }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0 gap-0.5">
      <div className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-brand-green animate-flow" />
        <span className="w-1 h-1 rounded-full bg-brand-green animate-flow delay-1" />
        <span className="w-1 h-1 rounded-full bg-brand-green animate-flow delay-2" />
      </div>
      {label && <span className="text-[9px] text-text-secondary">{label}</span>}
    </div>
  );
}

function GuideStep({ number, title, description, link, linkLabel }) {
  return (
    <li className="flex gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: `${number * 0.1}s` }}>
      <span className="flex-shrink-0 w-8 h-8 bg-brand-green/15 text-brand-green rounded-full flex items-center justify-center text-sm font-black">
        {number}
      </span>
      <div>
        <p className="font-bold text-text-primary text-sm">{title}</p>
        <p className="text-text-secondary text-xs mt-1 font-body leading-relaxed">{description}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link text-xs hover:underline font-bold mt-1 inline-block"
          >
            {linkLabel} &larr;
          </a>
        )}
      </div>
    </li>
  );
}
