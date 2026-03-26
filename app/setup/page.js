"use client";

import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";

/**
 * Setup Page — Configure your X API Bearer Token
 *
 * HOW IT WORKS:
 * The Bearer Token is saved to localStorage in your browser.
 * It's automatically included in every API request via the
 * "X-Bearer-Token" header. The server never stores it — it only
 * passes it through to the X API for the duration of each request.
 *
 * NO ENV VARS NEEDED:
 * You don't need to set environment variables on Vercel. Just paste
 * your token here and it's saved in your browser. If you open the
 * app in a different browser, you'll need to enter it again.
 *
 * SECURITY:
 * The token lives in localStorage (same-origin only). It's sent
 * over HTTPS to your own server, which uses it for X API calls.
 * The token is never logged or persisted on the server.
 */
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
        // Save to localStorage
        setToken(inputToken.trim());
        setInputToken("");
        setResult({ ...data, saved: true });
      } else {
        setResult(data);
      }
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
    if (!confirm("Remove your Bearer Token from this browser?")) return;
    clearToken();
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Setup</h1>
        <p className="text-text-secondary mt-1">
          Configure your X API Bearer Token — saved in your browser, no server config needed
        </p>
      </div>

      {/* Current Status */}
      <InfoCard title="Current Status" description="Your Bearer Token is stored in this browser's localStorage">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StatusBadge
              status={token ? "success" : "warning"}
              label={token ? "Token saved in browser" : "No token configured"}
            />
            {token && (
              <span className="text-xs text-text-secondary font-mono">
                {token.substring(0, 10)}...{token.substring(token.length - 6)}
              </span>
            )}
          </div>

          {token && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestCurrent}
                disabled={validating}
                className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 disabled:opacity-50 transition-all-fast"
              >
                {validating ? "Testing..." : "Test Current Token"}
              </button>
              <button
                onClick={handleRemoveToken}
                className="px-3 py-1.5 text-xs text-error border border-error/20 rounded hover:bg-error/10 transition-all-fast"
              >
                Remove Token
              </button>
            </div>
          )}
        </div>
      </InfoCard>

      {/* How It Works */}
      <InfoCard
        title="How Authentication Works"
        description="Understanding how your token is stored and used"
      >
        <div className="space-y-4">
          <ExplainerBox type="tip" title="No environment variables needed!">
            Your Bearer Token is stored in this browser&apos;s localStorage. It&apos;s sent
            to your server with each API call via a custom header. The server passes
            it to the X API and never stores it. No Vercel env vars, no redeployment.
          </ExplainerBox>

          <div className="flex items-center gap-3 py-3 px-4 bg-surface-light rounded-lg text-xs overflow-x-auto">
            <FlowStep label="Browser" sub="localStorage" />
            <Arrow label="X-Bearer-Token header" />
            <FlowStep label="Your Server" sub="passes through" />
            <Arrow label="Authorization header" />
            <FlowStep label="X API" sub="authenticates" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Where is the token stored?</p>
              <p className="text-text-secondary text-xs mt-1">
                In your browser&apos;s localStorage. It persists across page reloads and
                browser restarts. Clearing site data or using a different browser/device
                requires re-entering it.
              </p>
            </div>
            <div className="p-3 bg-surface-light rounded-lg">
              <p className="font-medium text-text-primary">Is it secure?</p>
              <p className="text-text-secondary text-xs mt-1">
                localStorage is same-origin only (no other sites can read it).
                The token travels over HTTPS to your server. For multi-user apps,
                server-side sessions would be more appropriate.
              </p>
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Add / Update Token */}
      <InfoCard
        title={token ? "Update Bearer Token" : "Add Bearer Token"}
        description="Paste your token below — it will be validated and saved to your browser"
      >
        <form onSubmit={handleValidateAndSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Bearer Token
            </label>
            <input
              type="password"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="AAAAAAAAAAAAAAAAAAA..."
              className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono"
            />
            <p className="text-xs text-text-secondary mt-1.5">
              The token is validated against the X API, then saved to localStorage.
              It never leaves your browser except in authenticated API calls.
            </p>
          </div>

          <button
            type="submit"
            disabled={validating || !inputToken.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all-fast"
          >
            {validating ? "Validating..." : "Validate & Save"}
          </button>

          {result && (
            <div className="mt-4">
              {result.valid ? (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-success text-lg">&#10003;</span>
                  <div>
                    <p className="text-success font-medium text-sm">{result.message}</p>
                    {result.saved && (
                      <p className="text-text-secondary text-xs mt-1">
                        Token has been saved to your browser. You can now manage rules and start streaming.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <ErrorDisplay
                  error={result.message}
                  code={result.code}
                  hint={result.status === 429 ? "Wait a minute and try again." : undefined}
                />
              )}
            </div>
          )}
        </form>
      </InfoCard>

      {/* How to Get a Token */}
      <InfoCard
        title="How to Get a Bearer Token"
        description="Step-by-step guide to obtaining your X API credentials"
      >
        <div className="space-y-4">
          <ExplainerBox type="info" title="What is a Bearer Token?">
            A Bearer Token is a credential that authenticates your application with the X API.
            It&apos;s like a password for your app — it proves your app is authorized to access the API.
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
                  {" "}if you don&apos;t have one already.
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
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-medium text-text-primary">Paste it above</p>
                <p className="text-text-secondary mt-0.5">
                  Come back here, paste the token in the field above, and click &quot;Validate &amp; Save&quot;.
                  That&apos;s it — no env vars, no redeployment.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </InfoCard>
    </div>
  );
}

function FlowStep({ label, sub }) {
  return (
    <div className="text-center px-3 py-1.5 bg-surface-lighter rounded flex-shrink-0">
      <div className="font-medium text-text-primary text-xs">{label}</div>
      <div className="text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function Arrow({ label }) {
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <span className="text-text-secondary text-xs">&rarr;</span>
      {label && <span className="text-[9px] text-text-secondary mt-0.5">{label}</span>}
    </div>
  );
}
