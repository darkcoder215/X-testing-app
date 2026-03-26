"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

/**
 * Auth Context — Manages the Bearer Token entirely in the browser.
 *
 * HOW IT WORKS:
 * The Bearer Token is stored in localStorage (browser-only, never sent
 * to the server unless you make an API call). Every API request from
 * the frontend includes the token in an "X-Bearer-Token" header.
 * The server-side API routes read that header and use it for X API calls.
 *
 * WHY NOT ENV VARS?
 * Environment variables require redeploying on Vercel every time you
 * change the token. With localStorage, you configure the token once
 * in the browser and it persists across sessions — no redeploy needed.
 *
 * SECURITY NOTE:
 * localStorage is accessible to any JavaScript on the same origin.
 * This is acceptable for a personal/internal tool. For a multi-user
 * app, you'd want server-side sessions or encrypted cookies instead.
 *
 * FALLBACK:
 * If no token is in localStorage, the API routes fall back to the
 * X_BEARER_TOKEN environment variable (if set). This means both
 * approaches work — browser-only OR env var OR both.
 */

const AuthContext = createContext(null);

const STORAGE_KEY = "x_bearer_token";

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setTokenState(stored);
    } catch {
      // localStorage not available (SSR or private browsing)
    }
    setLoaded(true);
  }, []);

  const setToken = useCallback((newToken) => {
    try {
      if (newToken) {
        localStorage.setItem(STORAGE_KEY, newToken);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage not available
    }
    setTokenState(newToken);
  }, []);

  const clearToken = useCallback(() => {
    setToken(null);
  }, [setToken]);

  /**
   * Make an authenticated API call. Automatically includes the
   * Bearer Token in the "X-Bearer-Token" header.
   *
   * Usage:
   *   const data = await apiFetch("/api/rules");
   *   const data = await apiFetch("/api/rules", {
   *     method: "POST",
   *     body: JSON.stringify({ add: [...] }),
   *   });
   */
  const apiFetch = useCallback(async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["X-Bearer-Token"] = token;
    }

    const response = await fetch(url, { ...options, headers });
    return response;
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, clearToken, loaded, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and methods.
 *
 * Returns:
 * - token: the current Bearer Token (or null)
 * - setToken(t): save a new token to localStorage
 * - clearToken(): remove the token
 * - loaded: whether localStorage has been read (avoids flash)
 * - apiFetch(url, opts): fetch wrapper that auto-includes the token
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
