"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-[calc(100vh-40px)] flex flex-col items-center justify-center px-6 py-12 overflow-hidden relative">
      {/* Floating decorative shapes */}
      <FloatingShapes />

      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto relative z-10">
        <div
          className={`transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-dark-slate rounded-full px-4 py-2 shadow-card mb-8">
            <img src="/rimthan-logo.jpg" alt="Rimthan" className="h-5 w-auto" />
          </div>
        </div>

        <h1
          className={`font-display text-3xl sm:text-5xl md:text-6xl font-black text-text-primary leading-tight transition-all duration-700 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          حلّل تغريدات
          <br />
          <span className="relative inline-block">
            منصة X
            <svg
              className="absolute -bottom-2 right-0 w-full"
              viewBox="0 0 200 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8C40 2 80 4 120 6C145 7 170 5 198 3"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={mounted ? "animate-draw-line" : ""}
                style={{
                  strokeDasharray: 200,
                  strokeDashoffset: mounted ? 0 : 200,
                }}
              />
            </svg>
          </span>
          {" "}بذكاء
        </h1>

        <p
          className={`font-body text-text-secondary text-base md:text-lg mt-6 leading-relaxed max-w-lg mx-auto px-2 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          استكشف واجهات X البرمجية، تابع التغريدات لحظيًا،
          واستخرج البيانات بسهولة — كل ذلك من مكان واحد.
        </p>
      </div>

      {/* Capability Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto mt-14 w-full relative z-10 transition-all duration-700 delay-300 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <CapabilityCard
          icon={<ExploreGraphic />}
          title="استكشاف API"
          description="جرّب 14 واجهة برمجية مع نتائج فورية"
          delay={0}
        />
        <CapabilityCard
          icon={<StreamGraphic />}
          title="بث مباشر"
          description="شاهد التغريدات المطابقة لحظة نشرها"
          delay={100}
        />
        <CapabilityCard
          icon={<ExtractGraphic />}
          title="استخراج بيانات"
          description="صدّر آلاف التغريدات كملف CSV"
          delay={200}
        />
      </div>

      {/* CTA with animated arrow */}
      <div
        className={`mt-16 flex flex-col items-center relative z-10 transition-all duration-700 delay-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Hand-drawn arrow */}
        <div className={`mb-4 ${mounted ? "animate-bounce-gentle" : ""}`}>
          <svg
            width="40"
            height="60"
            viewBox="0 0 40 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={mounted ? "animate-draw-arrow" : ""}
          >
            <path
              d="M20 2C18 15 22 28 20 42"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: mounted ? 0 : 50,
                transition: "stroke-dashoffset 1s ease 0.8s",
              }}
            />
            <path
              d="M10 35L20 48L30 35"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 30,
                strokeDashoffset: mounted ? 0 : 30,
                transition: "stroke-dashoffset 0.6s ease 1.4s",
              }}
            />
          </svg>
        </div>

        <Link
          href="/extractor"
          className="group relative inline-flex items-center gap-3 bg-black text-white rounded-full px-8 py-4 font-bold text-base shadow-elevated hover:shadow-card-hover transition-all duration-300 hover:scale-105"
        >
          <span>ابدأ استخراج البيانات</span>
          <span className="text-lg transition-transform duration-300 group-hover:-translate-x-1">
            &larr;
          </span>
        </Link>

        <p className="text-xs text-text-muted mt-4 font-body">
          لا تحتاج حسابًا — فقط أدخل مفتاح الوصول وابدأ
        </p>
      </div>

      {/* Footer brand */}
      <div
        className={`mt-20 text-center relative z-10 transition-all duration-1000 delay-700 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="inline-flex items-center gap-2 bg-dark-slate rounded-full px-4 py-2">
          <span className="text-[10px] font-bold text-white/60">by</span>
          <img src="/rimthan-logo.jpg" alt="Rimthan" className="h-4 w-auto" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Floating Shapes — decorative background elements
   ═══════════════════════════════════════════════════════ */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
      {/* Circles */}
      <div
        className="absolute w-64 h-64 rounded-full border border-border/50 animate-float"
        style={{ top: "8%", left: "5%" }}
      />
      <div
        className="absolute w-40 h-40 rounded-full bg-surface-light/60 animate-float"
        style={{ top: "15%", right: "8%", animationDelay: "2s" }}
      />
      <div
        className="absolute w-20 h-20 rounded-full border-2 border-border animate-float"
        style={{ bottom: "20%", left: "12%", animationDelay: "4s" }}
      />

      {/* Dots grid */}
      <div
        className="absolute opacity-[0.15]"
        style={{ top: "30%", right: "15%" }}
      >
        <DotGrid rows={4} cols={4} />
      </div>
      <div
        className="absolute opacity-[0.1]"
        style={{ bottom: "25%", left: "8%" }}
      >
        <DotGrid rows={3} cols={5} />
      </div>

      {/* Line accents */}
      <svg
        className="absolute top-[40%] right-[3%] opacity-10"
        width="120"
        height="2"
      >
        <line x1="0" y1="1" x2="120" y2="1" stroke="black" strokeWidth="2" />
      </svg>
      <svg
        className="absolute bottom-[35%] left-[5%] opacity-10"
        width="80"
        height="2"
      >
        <line x1="0" y1="1" x2="80" y2="1" stroke="black" strokeWidth="2" />
      </svg>
    </div>
  );
}

function DotGrid({ rows, cols }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="w-1.5 h-1.5 rounded-full bg-black" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Capability Card
   ═══════════════════════════════════════════════════════ */
function CapabilityCard({ icon, title, description, delay }) {
  return (
    <div
      className="bg-surface rounded-[16px] p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50 text-center"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="font-bold text-text-primary text-sm mb-1">{title}</h3>
      <p className="text-xs text-text-secondary font-body leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Mini Graphics for Capability Cards
   ═══════════════════════════════════════════════════════ */
function ExploreGraphic() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Search magnifier */}
      <circle cx="22" cy="22" r="10" stroke="black" strokeWidth="2.5" />
      <line
        x1="29"
        y1="29"
        x2="38"
        y2="38"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Data lines inside */}
      <line x1="17" y1="19" x2="27" y2="19" stroke="black" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="17" y1="23" x2="24" y2="23" stroke="black" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function StreamGraphic() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Signal waves */}
      <circle cx="24" cy="24" r="6" fill="black" />
      <path
        d="M14 14C18.5 18.5 18.5 29.5 14 34"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M34 14C29.5 18.5 29.5 29.5 34 34"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M9 9C16 16 16 32 9 39"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.15"
      />
      <path
        d="M39 9C32 16 32 32 39 39"
        stroke="black"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.15"
      />
    </svg>
  );
}

function ExtractGraphic() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Bar chart */}
      <rect x="8" y="28" width="6" height="12" rx="1" fill="black" opacity="0.2" />
      <rect x="17" y="20" width="6" height="20" rx="1" fill="black" opacity="0.4" />
      <rect x="26" y="14" width="6" height="26" rx="1" fill="black" opacity="0.6" />
      <rect x="35" y="8" width="6" height="32" rx="1" fill="black" opacity="0.9" />
      {/* Download arrow */}
      <line x1="24" y1="42" x2="24" y2="44" stroke="black" strokeWidth="1.5" strokeLinecap="round" opacity="0" />
    </svg>
  );
}
