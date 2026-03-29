"use client";

import { useState, useEffect, useCallback } from "react";
import InfoCard, { StatusBadge, ExplainerBox } from "../components/InfoCard";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: "", level: "" });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.category) params.set("category", filters.category);
      if (filters.level) params.set("level", filters.level);

      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      // Logs are non-critical
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  async function handleClear() {
    if (!confirm("هل تريد مسح جميع السجلات؟")) return;
    await fetch("/api/logs", { method: "DELETE" });
    fetchLogs();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div>
          <h1 className="font-display text-4xl font-black text-text-primary">السجل</h1>
          <p className="font-body text-text-secondary mt-2">
            تتبّع كل ما يحدث — طلبات، اتصالات، وأخطاء
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 text-xs rounded-full border font-bold transition-all-fast ${
              autoRefresh
                ? "bg-brand-green/10 text-brand-green border-brand-green/20"
                : "bg-surface text-text-secondary border-border"
            }`}
          >
            تحديث تلقائي {autoRefresh ? "مفعّل" : "متوقف"}
          </button>
          <button
            onClick={fetchLogs}
            className="btn-secondary text-xs py-2 px-4"
          >
            تحديث
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 text-xs text-brand-red border border-brand-red/20 rounded-full hover:bg-brand-red/10 transition-all-fast font-bold"
          >
            مسح الكل
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-text-secondary font-bold">تصفية:</span>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-4 py-2 bg-surface border border-border rounded-full text-sm text-text-primary focus:outline-none focus:border-brand-green font-bold"
        >
          <option value="">كل الفئات</option>
          <option value="auth">التوثيق</option>
          <option value="rules">القواعد</option>
          <option value="stream">البث</option>
          <option value="recovery">الاستعادة</option>
          <option value="system">النظام</option>
        </select>

        <select
          value={filters.level}
          onChange={(e) => setFilters({ ...filters, level: e.target.value })}
          className="px-4 py-2 bg-surface border border-border rounded-full text-sm text-text-primary focus:outline-none focus:border-brand-green font-bold"
        >
          <option value="">كل المستويات</option>
          <option value="info">معلومات</option>
          <option value="success">نجاح</option>
          <option value="warn">تحذير</option>
          <option value="error">خطأ</option>
        </select>

        <span className="text-xs text-text-muted mr-auto font-bold">
          {total} سجل
        </span>
      </div>

      {/* Log entries */}
      <InfoCard>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-[8px] animate-shimmer" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-20">&#128220;</div>
            <p className="text-text-secondary font-bold text-sm">لا توجد سجلات بعد</p>
            <p className="text-text-muted text-xs mt-1 font-body">ستظهر هنا عند استخدام الأداة</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((entry, i) => (
              <LogEntry key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        )}
      </InfoCard>

      {/* Explanation */}
      <InfoCard title="فهم السجلات" description="ماذا يعني كل مستوى؟">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-surface-light rounded-[12px]">
            <StatusBadge status="info" label="معلومات" />
            <p className="text-xs text-text-secondary font-body">
              عمليات عادية — طلبات API، اتصالات، وتغييرات حالة.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-light rounded-[12px]">
            <StatusBadge status="success" label="نجاح" />
            <p className="text-xs text-text-secondary font-body">
              عمليات ناجحة — تم التحقق من المفتاح، أُضيفت قاعدة، تم الاتصال.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-light rounded-[12px]">
            <StatusBadge status="warning" label="تحذير" />
            <p className="text-xs text-text-secondary font-body">
              مشاكل غير حرجة — محاولات إعادة اتصال، انخفاض حجم، فشل جزئي.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 bg-surface-light rounded-[12px]">
            <StatusBadge status="error" label="خطأ" />
            <p className="text-xs text-text-secondary font-body">
              فشل — أخطاء توثيق، أخطاء API، انقطاع البث.
            </p>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

function LogEntry({ entry, index }) {
  const [expanded, setExpanded] = useState(false);

  const levelColors = {
    info: "text-brand-blue",
    success: "text-brand-green",
    warn: "text-amber",
    error: "text-brand-red",
  };

  const levelLabels = {
    info: "معلومة",
    success: "نجاح",
    warn: "تحذير",
    error: "خطأ",
  };

  const categoryLabels = {
    auth: "توثيق",
    rules: "قواعد",
    stream: "بث",
    recovery: "استعادة",
    system: "نظام",
  };

  const time = new Date(entry.timestamp).toLocaleTimeString("ar-SA");

  return (
    <div
      className="flex items-start gap-3 py-2.5 px-4 rounded-[8px] hover:bg-surface-light cursor-pointer text-xs font-mono animate-fade-in-up opacity-0"
      style={{ animationDelay: `${Math.min(index * 0.02, 0.5)}s` }}
      onClick={() => entry.details && setExpanded(!expanded)}
    >
      <span className="text-text-muted flex-shrink-0 w-14 text-left" dir="ltr">{time}</span>
      <span className={`flex-shrink-0 w-12 font-black ${levelColors[entry.level]}`}>
        {levelLabels[entry.level]}
      </span>
      <span className="flex-shrink-0 w-14 text-text-muted font-bold">
        {categoryLabels[entry.category] || entry.category}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-text-primary font-ui">{entry.message}</span>
        {entry.details && (
          <span className="text-text-muted mr-2">
            {expanded ? "[-]" : "[+]"}
          </span>
        )}
        {expanded && entry.details && (
          <pre className="mt-2 text-text-secondary bg-surface-light p-3 rounded-[8px] overflow-x-auto font-mono text-[11px]" dir="ltr">
            {entry.details}
          </pre>
        )}
      </div>
    </div>
  );
}
