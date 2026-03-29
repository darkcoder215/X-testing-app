"use client";

/**
 * InfoCard — Thmanyah-styled card with rounded corners and subtle shadow.
 * White surface on off-white background per brand guidelines.
 */
export default function InfoCard({ title, description, children, className = "", green = false }) {
  return (
    <div className={`bg-surface rounded-[16px] shadow-card ${className}`}>
      {(title || description) && (
        <div className={`px-6 py-4 border-b border-border rounded-t-[16px] ${green ? "bg-brand-green" : ""}`}>
          {title && (
            <h2 className={`font-display text-lg font-bold ${green ? "text-white" : "text-text-primary"}`}>
              {title}
            </h2>
          )}
          {description && (
            <p className={`font-body text-sm mt-1 ${green ? "text-white/80" : "text-text-secondary"}`}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * StatusBadge — Thmanyah pill-shaped status indicator.
 */
export function StatusBadge({ status, label }) {
  const colors = {
    success: "bg-brand-green/15 text-brand-green border-brand-green/25",
    error: "bg-brand-red/15 text-brand-red border-brand-red/25",
    warning: "bg-amber/15 text-amber border-amber/25",
    info: "bg-brand-blue/15 text-brand-blue border-brand-blue/25",
    neutral: "bg-surface-lighter text-text-secondary border-border",
  };

  const dotColors = {
    success: "bg-brand-green",
    error: "bg-brand-red",
    warning: "bg-amber",
    info: "bg-brand-blue",
    neutral: "bg-text-secondary",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.neutral}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.neutral} ${status === "success" ? "animate-pulse-dot" : ""}`} />
      {label}
    </span>
  );
}

/**
 * ExplainerBox — Thmanyah-highlighted explanation box.
 * Uses the brand highlight style with colored backgrounds.
 */
export function ExplainerBox({ type = "info", title, children }) {
  const styles = {
    info: "bg-aqua-pale/50 border-sky-blue/30 text-text-primary",
    warning: "bg-yellow-pale/50 border-amber/30 text-text-primary",
    tip: "bg-brand-green-light/50 border-brand-green/30 text-text-primary",
    error: "bg-blush/50 border-brand-red/30 text-text-primary",
  };

  const iconStyles = {
    info: "bg-sky-blue/20 text-brand-blue",
    warning: "bg-amber/20 text-amber",
    tip: "bg-brand-green/20 text-brand-green",
    error: "bg-brand-red/20 text-brand-red",
  };

  const icons = {
    info: "i",
    warning: "!",
    tip: "\u2713",
    error: "\u00d7",
  };

  return (
    <div className={`rounded-[12px] border p-4 ${styles[type]}`}>
      <div className="flex gap-3">
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${iconStyles[type]}`}>
          {icons[type]}
        </span>
        <div className="font-body">
          {title && <p className="font-bold text-sm mb-1">{title}</p>}
          <div className="text-sm leading-relaxed opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorDisplay — Error message with Thmanyah styling.
 */
export function ErrorDisplay({ error, code, hint, onRetry }) {
  return (
    <div className="bg-blush/40 border border-brand-red/20 rounded-[12px] p-5">
      <div className="flex items-start gap-3">
        <span className="text-brand-red text-lg">&#9888;</span>
        <div className="flex-1 font-body">
          <p className="text-brand-red font-bold text-sm">{error}</p>
          {code && <p className="text-text-secondary text-xs mt-1 font-ui">({code})</p>}
          {hint && <p className="text-text-secondary text-sm mt-2">{hint}</p>}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 btn-danger text-xs py-2 px-4"
            >
              حاول مرة أخرى
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
