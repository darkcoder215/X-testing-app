"use client";

/**
 * InfoCard — A card component with an explanation section.
 *
 * Used throughout the app to group related content and provide
 * context about what each section does and why it matters.
 */
export default function InfoCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-surface rounded-xl border border-border ${className}`}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-border">
          {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * StatusBadge — Shows a colored status indicator.
 */
export function StatusBadge({ status, label }) {
  const colors = {
    success: "bg-success/20 text-success border-success/30",
    error: "bg-error/20 text-error border-error/30",
    warning: "bg-warning/20 text-warning border-warning/30",
    info: "bg-info/20 text-info border-info/30",
    neutral: "bg-surface-lighter text-text-secondary border-border",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.neutral}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === "success" ? "bg-success animate-pulse-dot" :
        status === "error" ? "bg-error" :
        status === "warning" ? "bg-warning" :
        status === "info" ? "bg-info" : "bg-text-secondary"
      }`} />
      {label}
    </span>
  );
}

/**
 * ExplainerBox — A highlighted box that explains a concept.
 */
export function ExplainerBox({ type = "info", title, children }) {
  const styles = {
    info: "bg-info/5 border-info/20 text-info",
    warning: "bg-warning/5 border-warning/20 text-warning",
    tip: "bg-success/5 border-success/20 text-success",
    error: "bg-error/5 border-error/20 text-error",
  };

  const icons = {
    info: "i",
    warning: "!",
    tip: "\u2713",
    error: "\u00d7",
  };

  return (
    <div className={`rounded-lg border p-4 ${styles[type]}`}>
      <div className="flex gap-3">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-current/10 text-current flex items-center justify-center text-xs font-bold">
          {icons[type]}
        </span>
        <div>
          {title && <p className="font-medium text-sm mb-1">{title}</p>}
          <div className="text-sm opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * ErrorDisplay — Shows an error message with optional details and actions.
 */
export function ErrorDisplay({ error, code, hint, onRetry }) {
  return (
    <div className="bg-error/5 border border-error/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-error text-lg">&#9888;</span>
        <div className="flex-1">
          <p className="text-error font-medium text-sm">{error}</p>
          {code && <p className="text-text-secondary text-xs mt-1">Error code: {code}</p>}
          {hint && <p className="text-text-secondary text-sm mt-2">{hint}</p>}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1 text-xs bg-error/10 text-error border border-error/20 rounded hover:bg-error/20 transition-all-fast"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
