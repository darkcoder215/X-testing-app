"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import InfoCard, { StatusBadge, ExplainerBox } from "./components/InfoCard";

/**
 * Dashboard — The main landing page.
 *
 * Shows a quick overview of the app's status:
 * - Whether credentials are configured
 * - Number of active rules
 * - Stream connection status
 * - Quick-start guide for new users
 */
export default function DashboardPage() {
  const [status, setStatus] = useState({
    auth: { loading: true, configured: false },
    rules: { loading: true, count: 0 },
    stream: { loading: true, connected: false },
  });

  useEffect(() => {
    // Fetch all statuses in parallel
    Promise.allSettled([
      fetch("/api/auth").then((r) => r.json()),
      fetch("/api/rules").then((r) => r.json()),
      fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  }, []);

  const allConfigured = status.auth.configured && status.rules.count > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Overview of your X Filtered Stream configuration
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Authentication"
          loading={status.auth.loading}
          configured={status.auth.configured}
          configuredLabel="Token configured"
          notConfiguredLabel="Not configured"
          href="/setup"
          linkLabel="Go to Setup"
        />
        <StatusCard
          title="Stream Rules"
          loading={status.rules.loading}
          configured={status.rules.count > 0}
          configuredLabel={`${status.rules.count} active rule(s)`}
          notConfiguredLabel={status.rules.error ? "Error loading" : "No rules set"}
          href="/rules"
          linkLabel="Manage Rules"
        />
        <StatusCard
          title="Live Stream"
          loading={status.stream.loading}
          configured={status.stream.connected}
          configuredLabel="Connected"
          notConfiguredLabel="Disconnected"
          href="/stream"
          linkLabel="View Stream"
        />
      </div>

      {/* Quick Start Guide */}
      {!allConfigured && (
        <InfoCard
          title="Getting Started"
          description="Follow these steps to start streaming Posts from X in real-time"
        >
          <div className="space-y-4">
            <Step
              number={1}
              title="Configure your Bearer Token"
              description="Get a Bearer Token from the X Developer Portal and add it on the Setup page. The token authenticates your app with the X API."
              done={status.auth.configured}
              href="/setup"
            />
            <Step
              number={2}
              title="Add filter rules"
              description='Rules define which Posts appear in your stream. For example: "#AI lang:en -is:retweet" matches English AI-related Posts that aren&apos;t retweets.'
              done={status.rules.count > 0}
              href="/rules"
            />
            <Step
              number={3}
              title="Start streaming"
              description="Connect to the Filtered Stream to see matching Posts appear in real-time. The stream stays open until you stop it."
              done={status.stream.connected}
              href="/stream"
            />
          </div>
        </InfoCard>
      )}

      {/* How It Works */}
      <InfoCard
        title="How It Works"
        description="Understanding the Filtered Stream pipeline"
      >
        <div className="space-y-4">
          <ExplainerBox type="info" title="What is Filtered Stream?">
            The X API Filtered Stream lets you receive Posts in near real-time
            that match rules you define. Instead of searching for Posts after they&apos;re
            published, the stream pushes them to you as they happen (~6-7 second latency).
          </ExplainerBox>

          <div className="flex items-center gap-3 py-4 px-4 bg-surface-light rounded-lg text-sm overflow-x-auto">
            <PipelineStep label="Your Rules" sublabel="Filter criteria" />
            <Arrow />
            <PipelineStep label="X API" sublabel="Matches Posts" />
            <Arrow />
            <PipelineStep label="Stream" sublabel="Real-time delivery" />
            <Arrow />
            <PipelineStep label="This App" sublabel="Display & process" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Rules (up to 1,000)</p>
              <p className="text-text-secondary mt-1">
                Define what Posts to receive using operators like keywords, hashtags,
                usernames, language, and boolean logic.
              </p>
            </div>
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Persistent connection</p>
              <p className="text-text-secondary mt-1">
                The stream is a long-lived HTTP connection. The app auto-reconnects
                if it drops, with smart backoff strategies per error type.
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Stream Stats (if connected) */}
      {status.stream.stats && status.stream.stats.totalPosts > 0 && (
        <InfoCard title="Stream Statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Posts" value={status.stream.stats.totalPosts} />
            <Stat label="Duplicates Filtered" value={status.stream.stats.duplicatesFiltered} />
            <Stat label="SSE Clients" value={status.stream.stats.connectedClients} />
            <Stat label="Uptime" value={formatUptime(status.stream.stats.uptime)} />
          </div>
        </InfoCard>
      )}
    </div>
  );
}

function StatusCard({ title, loading, configured, configuredLabel, notConfiguredLabel, href, linkLabel }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {loading ? (
          <span className="text-xs text-text-secondary">Loading...</span>
        ) : (
          <StatusBadge
            status={configured ? "success" : "warning"}
            label={configured ? configuredLabel : notConfiguredLabel}
          />
        )}
      </div>
      <Link
        href={href}
        className="text-sm text-primary hover:text-primary-dark transition-all-fast"
      >
        {linkLabel} &rarr;
      </Link>
    </div>
  );
}

function Step({ number, title, description, done, href }) {
  return (
    <div className="flex gap-4">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        done ? "bg-success/20 text-success" : "bg-surface-lighter text-text-secondary"
      }`}>
        {done ? "\u2713" : number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${done ? "text-success" : "text-text-primary"}`}>{title}</h3>
          {done && <StatusBadge status="success" label="Done" />}
        </div>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
        {!done && (
          <Link href={href} className="text-sm text-primary hover:text-primary-dark mt-2 inline-block">
            {title} &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}

function PipelineStep({ label, sublabel }) {
  return (
    <div className="text-center px-3 py-2 bg-surface-lighter rounded-lg flex-shrink-0">
      <div className="font-medium text-text-primary">{label}</div>
      <div className="text-xs text-text-secondary">{sublabel}</div>
    </div>
  );
}

function Arrow() {
  return <span className="text-text-secondary flex-shrink-0">&rarr;</span>;
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds || seconds === 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
