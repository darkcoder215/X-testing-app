"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "الرئيسية",
    icon: DashboardIcon,
    description: "نظرة عامة وحالة النظام",
  },
  {
    href: "/rules",
    label: "القواعد",
    icon: FilterIcon,
    description: "حدد ما تريد متابعته",
  },
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
    href: "/logs",
    label: "السجل",
    icon: LogsIcon,
    description: "سجل العمليات والأخطاء",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 bottom-0 w-[260px] bg-dark-slate flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-charcoal">
        <div className="flex items-center gap-3">
          <Image
            src="/thamanyah.png"
            alt="ثمانية"
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <div>
            <h1 className="font-display text-lg font-bold text-text-on-dark">محلل التغريدات</h1>
            <p className="text-xs text-muted mt-0.5">بث وتحليل لحظي</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3.5 text-sm transition-all-fast ${
                isActive
                  ? "bg-brand-green/10 text-brand-green border-r-[3px] border-brand-green"
                  : "text-muted hover:text-text-on-dark hover:bg-charcoal/50 border-r-[3px] border-transparent"
              }`}
            >
              <item.icon active={isActive} />
              <div>
                <div className={`font-bold text-[13px] ${isActive ? "text-brand-green" : ""}`}>
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
          X API v2 — واجهة برمجية
        </p>
      </div>
    </aside>
  );
}

// --- Icon components ---

function DashboardIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-brand-green" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  );
}


function FilterIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-brand-green" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  );
}

function ExploreIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-brand-green" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
    </svg>
  );
}

function StreamIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-brand-green" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function LogsIcon({ active }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 ${active ? "text-brand-green" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}
