"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/explore",
    label: "استكشاف",
    icon: ExploreIcon,
    description: "جرّب واجهات X البرمجية",
  },
  {
    href: "/stream",
    label: "البث المباشر",
    icon: StreamIcon,
    description: "تابع التغريدات لحظيًا",
  },
  {
    href: "/extractor",
    label: "استخراج البيانات",
    icon: ExtractorIcon,
    description: "استخرج تغريدات كملف CSV",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 right-0 left-0 h-14 bg-dark-slate flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <img src="/rimthan-logo.jpg" alt="Rimthan" className="h-11 w-auto" />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-charcoal/50 text-text-on-dark"
          aria-label="القائمة"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: fixed, mobile: slide-in overlay */}
      <aside
        className={`
          fixed top-0 bottom-0 w-[260px] bg-dark-slate flex flex-col z-50
          transition-transform duration-300 ease-out
          right-0
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          md:top-0
          top-14
        `}
      >
        {/* Logo — desktop only */}
        <div className="hidden md:block p-5 border-b border-charcoal">
          <img src="/rimthan-logo.jpg" alt="Rimthan" className="w-full h-auto rounded-lg" />
          <p className="text-[11px] text-muted mt-3 text-center">محلل التغريدات</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-6 py-3.5 text-sm transition-all-fast ${
                  isActive
                    ? "bg-white/10 text-white border-r-[3px] border-white"
                    : "text-muted hover:text-text-on-dark hover:bg-charcoal/50 border-r-[3px] border-transparent"
                }`}
              >
                <item.icon active={isActive} />
                <div>
                  <div className={`font-bold text-[13px] ${isActive ? "text-white" : ""}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] text-muted/70">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-charcoal">
          <p className="text-[11px] text-muted text-center">
            X API v2 — by Rimthan
          </p>
        </div>
      </aside>
    </>
  );
}

// --- Icon components ---

function ExploreIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
    </svg>
  );
}

function StreamIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function ExtractorIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
