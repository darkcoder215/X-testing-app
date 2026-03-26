"use client";

import { useState, useEffect } from "react";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";

/**
 * Setup Page — Configure your X API Bearer Token
 *
 * This page helps you:
 * 1. Understand what a Bearer Token is and where to get one
 * 2. Enter and validate your token against the X API
 * 3. See your current authentication status
 *
 * WHY THIS PAGE EXISTS:
 * The Bearer Token is required for all X API calls. Without it,
 * no rules can be created and the stream won't connect. This page
 * ensures users can verify their token before attempting to stream.
 *
 * HOW TOKENS WORK ON VERCEL:
 * Set X_BEARER_TOKEN as an environment variable in Vercel's dashboard
 * (Settings > Environment Variables). The token is read from process.env
 * on the server side and never sent to the browser.
 */
export default function SetupPage() {
  const [authStatus, setAuthStatus] = useState({ loading: true, configured: false });
  const [token, setToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => setAuthStatus({ loading: false, ...data }))
      .catch(() => setAuthStatus({ loading: false, configured: false }));
  }, []);

  async function handleValidate(e) {
    e.preventDefault();
    if (!token.trim()) return;

    setValidating(true);
    setResult(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bearerToken: token.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        valid: false,
        message: "Network error. Could not reach the server.",
        code: "NETWORK_ERROR",
      });
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Setup</h1>
        <p className="text-text-secondary mt-1">
          Configure your X API Bearer Token to enable streaming
        </p>
      </div>

      {/* Current Status */}
      <InfoCard title="Current Status" description="Whether your app is authenticated with the X API">
        {authStatus.loading ? (
          <p className="text-text-secondary text-sm">Checking authentication...</p>
        ) : (
          <div className="flex items-center gap-3">
            <StatusBadge
              status={authStatus.configured ? "success" : "warning"}
              label={authStatus.configured ? "Token configured" : "Not configured"}
            />
            <span className="text-sm text-text-secondary">{authStatus.message}</span>
          </div>
        )}
      </InfoCard>

      {/* How to Get a Token */}
      <InfoCard
        title="How to Get a Bearer Token"
        description="Step-by-step guide to obtaining your X API credentials"
      >
        <div className="space-y-4">
          <ExplainerBox type="info" title="What is a Bearer Token?">
            A Bearer Token is a credential that authenticates your application with the X API.
            It&apos;s like a password that proves your app is authorized to access the API.
            The token is tied to your X Developer App, not your personal account.
          </ExplainerBox>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-medium text-text-primary">Create a Developer Account</p>
                <p className="text-text-secondary mt-0.5">
                  Sign up at{" "}
                  <a href="https://developer.x.com/en/portal/petition/essential/basic-info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    developer.x.com
                  </a>
                  {" "}if you don&apos;t have one already. Approval is usually instant.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-medium text-text-primary">Create a Project and App</p>
                <p className="text-text-secondary mt-0.5">
                  In the{" "}
                  <a href="https://developer.x.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Developer Portal
                  </a>
                  , create a new Project, then create an App inside it.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-medium text-text-primary">Generate a Bearer Token</p>
                <p className="text-text-secondary mt-0.5">
                  Go to your App&apos;s &quot;Keys and Tokens&quot; page and generate a Bearer Token.
                  Copy it — you&apos;ll only see it once.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </InfoCard>

      {/* Token Validation */}
      <InfoCard
        title="Validate Your Token"
        description="Test your Bearer Token to make sure it works before deploying"
      >
        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Bearer Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="AAAAAAAAAAAAAAAAAAA..."
              className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono"
            />
            <p className="text-xs text-text-secondary mt-1.5">
              Your token is sent to the server for validation but is not stored in the browser.
            </p>
          </div>

          <button
            type="submit"
            disabled={validating || !token.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all-fast"
          >
            {validating ? "Validating..." : "Validate Token"}
          </button>

          {result && (
            <div className="mt-4">
              {result.valid ? (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-success text-lg">&#10003;</span>
                  <div>
                    <p className="text-success font-medium text-sm">{result.message}</p>
                    {result.details?.ruleCount > 0 && (
                      <p className="text-text-secondary text-xs mt-1">
                        You already have {result.details.ruleCount} rule(s) configured on X&apos;s servers.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ErrorDisplay
                  error={result.message}
                  code={result.code}
                  hint={result.status === 429 ? "Wait a minute and try again." : undefined}
                  onRetry={() => handleValidate({ preventDefault: () => {} })}
                />
              )}
            </div>
          )}
        </form>
      </InfoCard>

      {/* Deployment Instructions */}
      <InfoCard
        title="Setting Up on Vercel"
        description="How to configure your token for production deployment"
      >
        <div className="space-y-4">
          <ExplainerBox type="tip" title="Environment Variables">
            On Vercel, set your Bearer Token as an environment variable. It&apos;s never
            exposed to the browser — all API calls happen on the server side.
          </ExplainerBox>

          <div className="bg-surface-light rounded-lg p-4">
            <p className="text-sm font-medium text-text-primary mb-2">Steps:</p>
            <ol className="text-sm text-text-secondary space-y-1.5 list-decimal list-inside">
              <li>Go to your Vercel project&apos;s Settings &gt; Environment Variables</li>
              <li>Add a new variable: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">X_BEARER_TOKEN</code></li>
              <li>Paste your Bearer Token as the value</li>
              <li>Select all environments (Production, Preview, Development)</li>
              <li>Click Save, then redeploy your app</li>
            </ol>
          </div>

          <ExplainerBox type="warning" title="For local development">
            Create a <code className="text-xs">.env</code> file in the project root with:
            <pre className="mt-1 text-xs bg-black/30 p-2 rounded">X_BEARER_TOKEN=your_token_here</pre>
            This file is gitignored and won&apos;t be committed.
          </ExplainerBox>
        </div>
      </InfoCard>
    </div>
  );
}
