"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import InfoCard, { ExplainerBox, StatusBadge, ErrorDisplay } from "../components/InfoCard";

/**
 * Rules Page — Manage Filtered Stream rules
 *
 * This page lets you:
 * - View all active rules with their IDs and tags
 * - Add new rules with a visual builder
 * - Delete individual rules or all rules at once
 * - See example rules with explanations
 *
 * All API calls use apiFetch which auto-includes the Bearer Token
 * from localStorage via the "X-Bearer-Token" header.
 *
 * WHY RULES MATTER:
 * Rules determine which Posts appear in your stream. Without rules,
 * the stream won't deliver any data. Rules persist on X's servers —
 * once added, they remain active even if you disconnect or restart.
 */
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
      setError({ error: "No Bearer Token configured.", code: "AUTH_NOT_CONFIGURED", hint: "Add your token on the Setup page." });
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
          message: data.error || data.errors?.map((e) => e.title).join(", ") || "Failed to add rule",
        });
      } else {
        setFeedback({ type: "success", message: data.message });
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
        setFeedback({ type: "success", message: "Rule deleted" });
        await fetchRules();
      }
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Delete all rules? This cannot be undone.")) return;

    setDeleting("all");
    try {
      const res = await apiFetch("/api/rules", {
        method: "POST",
        body: JSON.stringify({ deleteAll: true }),
      });
      const data = await res.json();
      setFeedback({ type: "success", message: data.message });
      await fetchRules();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Stream Rules</h1>
        <p className="text-text-secondary mt-1">
          Rules define which Posts appear in your stream. They persist on X&apos;s servers.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`p-3 rounded-lg text-sm ${
          feedback.type === "success"
            ? "bg-success/10 text-success border border-success/20"
            : "bg-error/10 text-error border border-error/20"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Add New Rule */}
      <InfoCard
        title="Add a Rule"
        description="Create a filter rule using X's query operators. Each rule defines a set of matching criteria."
      >
        <form onSubmit={handleAddRule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rule value <span className="text-text-secondary font-normal">(required)</span>
            </label>
            <input
              type="text"
              value={newRule.value}
              onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
              placeholder='e.g., #AI lang:en -is:retweet'
              className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono"
            />
            <p className="text-xs text-text-secondary mt-1.5">
              {newRule.value.length}/1,024 characters (pay-per-use) or 2,048 (Enterprise).
              {newRule.value.length > 1024 && (
                <span className="text-warning"> Exceeds pay-per-use limit.</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tag <span className="text-text-secondary font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={newRule.tag}
              onChange={(e) => setNewRule({ ...newRule, tag: e.target.value })}
              placeholder="e.g., AI English tweets"
              className="w-full px-4 py-2.5 bg-surface-light border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
            <p className="text-xs text-text-secondary mt-1.5">
              A label to identify this rule. Shows in matching_rules when a Post matches.
            </p>
          </div>

          <button
            type="submit"
            disabled={adding || !newRule.value.trim() || !token}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all-fast"
          >
            {adding ? "Adding..." : "Add Rule"}
          </button>
        </form>
      </InfoCard>

      {/* Current Rules */}
      <InfoCard
        title="Active Rules"
        description={`${rules.length} rule(s) currently registered on X's servers`}
      >
        {loading ? (
          <p className="text-text-secondary text-sm">Loading rules...</p>
        ) : error ? (
          <ErrorDisplay
            error={error.error}
            code={error.code}
            hint={error.hint}
            onRetry={fetchRules}
          />
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm">No rules configured yet.</p>
            <p className="text-text-secondary text-xs mt-1">Add a rule above to start receiving Posts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-text-secondary">{rules.length} rule(s)</span>
              <button
                onClick={handleDeleteAll}
                disabled={deleting === "all"}
                className="px-3 py-1 text-xs text-error border border-error/20 rounded hover:bg-error/10 disabled:opacity-50 transition-all-fast"
              >
                {deleting === "all" ? "Deleting..." : "Delete All"}
              </button>
            </div>

            {rules.map((rule) => (
              <div key={rule.id} className="flex items-start gap-3 p-4 bg-surface-light rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <code className="text-sm text-primary font-mono break-all">{rule.value}</code>
                  <div className="flex items-center gap-3 mt-2">
                    {rule.tag && <StatusBadge status="info" label={rule.tag} />}
                    <span className="text-xs text-text-secondary font-mono">ID: {rule.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={deleting === rule.id}
                  className="flex-shrink-0 px-2 py-1 text-xs text-error border border-error/20 rounded hover:bg-error/10 disabled:opacity-50 transition-all-fast"
                >
                  {deleting === rule.id ? "..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      {/* Rule Syntax Guide */}
      <InfoCard
        title="Rule Syntax Guide"
        description="How to write effective filter rules"
      >
        <div className="space-y-4">
          <ExplainerBox type="info" title="How rules work">
            Rules use the same query language as X search. You can combine operators
            with AND (space), OR, NOT (-), and grouping (parentheses). Each rule is
            evaluated independently — a Post matches if it satisfies ANY of your rules.
          </ExplainerBox>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">Example Rule</th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">What It Matches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {EXAMPLE_RULES.map((ex, i) => (
                  <tr key={i} className="hover:bg-surface-light">
                    <td className="py-2.5 px-3">
                      <code className="text-primary text-xs font-mono">{ex.value}</code>
                    </td>
                    <td className="py-2.5 px-3 text-text-secondary">{ex.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ExplainerBox type="tip" title="Common operators">
            <ul className="space-y-1 mt-1">
              <li><code className="text-xs">from:username</code> — Posts by a specific user</li>
              <li><code className="text-xs">to:username</code> — Replies to a specific user</li>
              <li><code className="text-xs">#hashtag</code> — Posts containing a hashtag</li>
              <li><code className="text-xs">lang:en</code> — Posts in a specific language</li>
              <li><code className="text-xs">has:images</code> — Posts with images attached</li>
              <li><code className="text-xs">has:links</code> — Posts containing URLs</li>
              <li><code className="text-xs">-is:retweet</code> — Exclude retweets</li>
              <li><code className="text-xs">-is:reply</code> — Exclude replies</li>
              <li><code className="text-xs">&quot;exact phrase&quot;</code> — Match an exact phrase</li>
            </ul>
          </ExplainerBox>
        </div>
      </InfoCard>
    </div>
  );
}

const EXAMPLE_RULES = [
  { value: "#python", description: "Posts with the #python hashtag" },
  { value: "from:elonmusk", description: "Posts by @elonmusk" },
  { value: '"breaking news" has:images', description: "Posts with exact phrase and images" },
  { value: "(@XDevelopers OR @X) -is:retweet", description: "Mentions, excluding retweets" },
  { value: '(AI OR "machine learning") lang:en -is:retweet', description: "AI-related English Posts, no RTs" },
  { value: "#tech has:links -is:retweet -is:reply", description: "Tech posts with links, original only" },
];
