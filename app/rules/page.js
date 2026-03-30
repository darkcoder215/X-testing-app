"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";

export default function RulesPage() {
  const { apiFetch, token, loaded } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRule, setNewRule] = useState({ value: "", tag: "" });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchRules = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError({ error: "لم تتم إضافة مفتاح الوصول بعد.", code: "AUTH_NOT_CONFIGURED" });
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/rules");
      const data = await res.json();
      if (data.error) {
        setError(data);
      } else {
        setRules(data.rules || []);
      }
    } catch (err) {
      setError({ error: err.message, code: "NETWORK_ERROR" });
    } finally {
      setLoading(false);
    }
  }, [apiFetch, token]);

  useEffect(() => {
    if (loaded) fetchRules();
  }, [loaded, fetchRules]);

  async function handleAddRule(e) {
    e.preventDefault();
    if (!newRule.value.trim()) return;

    setAdding(true);
    setFeedback(null);

    try {
      const rule = { value: newRule.value.trim() };
      if (newRule.tag.trim()) rule.tag = newRule.tag.trim();

      const res = await apiFetch("/api/rules", {
        method: "POST",
        body: JSON.stringify({ add: [rule] }),
      });
      const data = await res.json();

      if (data.error || data.errors) {
        setFeedback({
          type: "error",
          message: data.error || data.errors?.map((e) => e.title).join(", ") || "فشل في إضافة القاعدة",
        });
      } else {
        setFeedback({ type: "success", message: "تمت إضافة القاعدة بنجاح" });
        setNewRule({ value: "", tag: "" });
        await fetchRules();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteRule(id) {
    setDeleting(id);
    try {
      const res = await apiFetch("/api/rules", {
        method: "POST",
        body: JSON.stringify({ delete: { ids: [id] } }),
      });
      const data = await res.json();
      if (data.error) {
        setFeedback({ type: "error", message: data.error });
      } else {
        setFeedback({ type: "success", message: "تم حذف القاعدة" });
        await fetchRules();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAll() {
    if (!confirm("هل تريد حذف جميع القواعد؟ لا يمكن التراجع.")) return;

    setDeleting("all");
    try {
      const res = await apiFetch("/api/rules", {
        method: "POST",
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await res.json();
      setFeedback({ type: "success", message: data.message || "تم حذف جميع القواعد" });
      await fetchRules();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl font-black text-text-primary">القواعد</h1>
        <p className="font-body text-text-secondary mt-2 text-base">
          حدد ما تريد متابعته — القواعد تخبر X أي التغريدات ترسلها لك
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-4 rounded-[12px] text-sm font-bold animate-fade-in-up ${
          feedback.type === "success"
            ? "bg-brand-green-light/30 text-brand-green border border-brand-green/20"
            : "bg-blush/40 text-brand-red border border-brand-red/20"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* What are rules — simple explanation */}
      <ExplainerBox type="info" title="ما هي القواعد؟">
        القواعد تشبه فلتر البحث — تكتب كلمات أو شروط، وX ترسل لك فقط التغريدات
        التي تطابقها. مثلًا: إذا كتبت &quot;#كرة_قدم&quot;، ستصلك كل التغريدات التي تحتوي
        هذا الهاشتاق. يمكنك إضافة حتى 1,000 قاعدة مختلفة تعمل معًا.
      </ExplainerBox>

      {/* Add New Rule */}
      <InfoCard
        title="أضف قاعدة جديدة"
        description="اكتب الكلمات أو الشروط التي تريد تصفية التغريدات بها"
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              نص القاعدة <span className="text-text-muted font-normal">(مطلوب)</span>
            </label>
            <input
              type="text"
              value={newRule.value}
              onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
              placeholder='مثال: #تقنية lang:ar -is:retweet'
              dir="ltr"
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm font-mono"
            />
            <p className="text-xs text-text-secondary mt-2 font-body">
              {newRule.value.length}/1,024 حرف.
              {newRule.value.length > 1024 && (
                <span className="text-brand-red font-bold"> تجاوزت الحد الأقصى!</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              تسمية <span className="text-text-muted font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              value={newRule.tag}
              onChange={(e) => setNewRule({ ...newRule, tag: e.target.value })}
              placeholder="مثال: تغريدات تقنية عربية"
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 text-sm"
            />
            <p className="text-xs text-text-secondary mt-2 font-body">
              التسمية تساعدك على تمييز كل قاعدة. تظهر مع كل تغريدة مطابقة.
            </p>
          </div>

          <button
            type="submit"
            disabled={adding || !newRule.value.trim() || !token}
            className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {adding ? "جارٍ الإضافة..." : "أضف القاعدة"}
          </button>
        </form>
      </InfoCard>

      {/* Current Rules */}
      <InfoCard
        title="القواعد النشطة"
        description={`${rules.length} قاعدة مسجلة حاليًا على خوادم X`}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-[12px] animate-shimmer" />
            ))}
          </div>
        ) : error ? (
          <ErrorDisplay
            error={error.error}
            code={error.code}
            hint={error.hint}
            onRetry={fetchRules}
          />
        ) : rules.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3 opacity-30">&#9778;</div>
            <p className="text-text-secondary font-bold text-sm">لا توجد قواعد بعد</p>
            <p className="text-text-muted text-xs mt-1 font-body">أضف قاعدة أعلاه لبدء استقبال التغريدات</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-text-secondary font-bold">{rules.length} قاعدة</span>
              <button
                onClick={handleDeleteAll}
                disabled={deleting === "all"}
                className="px-4 py-2 text-xs text-brand-red border border-brand-red/20 rounded-full hover:bg-brand-red/10 disabled:opacity-50 transition-all-fast font-bold"
              >
                {deleting === "all" ? "جارٍ الحذف..." : "حذف الكل"}
              </button>
            </div>

            {rules.map((rule, i) => (
              <div
                key={rule.id}
                className="flex items-start gap-4 p-4 bg-surface-light rounded-[12px] border border-border animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <code className="text-sm text-link font-mono break-all" dir="ltr">{rule.value}</code>
                  <div className="flex items-center gap-3 mt-2">
                    {rule.tag && <StatusBadge status="info" label={rule.tag} />}
                    <span className="text-[11px] text-text-muted font-mono" dir="ltr">ID: {rule.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={deleting === rule.id}
                  className="flex-shrink-0 px-3 py-1.5 text-xs text-brand-red border border-brand-red/20 rounded-full hover:bg-brand-red/10 disabled:opacity-50 transition-all-fast font-bold"
                >
                  {deleting === rule.id ? "..." : "حذف"}
                </button>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      {/* Rule Syntax Guide */}
      <InfoCard
        title="دليل كتابة القواعد"
        description="أمثلة وشرح لمساعدتك في كتابة قواعد فعالة"
      >
        <div className="space-y-5">
          <ExplainerBox type="tip" title="كيف تعمل القواعد؟">
            القواعد تستخدم نفس لغة البحث في X. يمكنك دمج كلمات مع شروط
            باستخدام المسافة (و)، أو OR (أو)، أو علامة - (استبعاد).
            كل قاعدة تعمل مستقلة — التغريدة تصلك إذا طابقت أي قاعدة.
          </ExplainerBox>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-black text-white rounded-t-[12px]">
                  <th className="text-right py-3 px-4 font-bold rounded-tr-[12px]">القاعدة</th>
                  <th className="text-right py-3 px-4 font-bold rounded-tl-[12px]">ماذا تطابق؟</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_RULES.map((ex, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-surface-light"}>
                    <td className="py-3 px-4">
                      <code className="text-link text-xs font-mono" dir="ltr">{ex.value}</code>
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-body text-xs">{ex.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ExplainerBox type="info" title="أهم الأوامر المستخدمة">
            <ul className="space-y-1.5 mt-1 font-body">
              <li><code className="text-xs text-link" dir="ltr">from:username</code> — تغريدات حساب معين</li>
              <li><code className="text-xs text-link" dir="ltr">to:username</code> — ردود على حساب معين</li>
              <li><code className="text-xs text-link" dir="ltr">#هاشتاق</code> — تغريدات تحتوي هاشتاق</li>
              <li><code className="text-xs text-link" dir="ltr">lang:ar</code> — تغريدات بلغة معينة</li>
              <li><code className="text-xs text-link" dir="ltr">has:images</code> — تغريدات فيها صور</li>
              <li><code className="text-xs text-link" dir="ltr">-is:retweet</code> — استبعاد إعادة التغريد</li>
              <li><code className="text-xs text-link" dir="ltr">&quot;عبارة بالضبط&quot;</code> — مطابقة تامة لعبارة</li>
            </ul>
          </ExplainerBox>

          {/* Conclusion */}
          <div className="p-4 bg-brand-green-light/30 rounded-[12px] border border-brand-green/20">
            <p className="font-bold text-brand-green text-sm mb-1">الخلاصة</p>
            <p className="text-text-primary text-sm font-body leading-relaxed">
              ابدأ بقاعدة بسيطة مثل هاشتاق واحد. جرّب البث وشاهد النتائج.
              ثم عدّل القاعدة وأضف شروطًا أكثر حتى تحصل على التغريدات التي تحتاجها تمامًا.
            </p>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

const EXAMPLE_RULES = [
  { value: "#بايثون", description: "تغريدات تحتوي هاشتاق #بايثون" },
  { value: "from:elonmusk", description: "تغريدات من حساب إيلون ماسك" },
  { value: '"أخبار عاجلة" has:images', description: "تغريدات فيها عبارة أخبار عاجلة مع صور" },
  { value: "(AI OR #ذكاء_اصطناعي) lang:ar -is:retweet", description: "تغريدات عربية عن الذكاء الاصطناعي بدون ريتويت" },
  { value: "#تقنية has:links -is:reply", description: "تغريدات تقنية فيها روابط، أصلية فقط" },
];
