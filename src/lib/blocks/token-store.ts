"use client";

/**
 * In-memory holder for the current Blocks bearer access token. Deliberately not
 * localStorage/sessionStorage — the token only ever lives in JS memory for this tab,
 * sourced from this app's own httpOnly session cookie via /api/auth/session.
 */

let currentToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken(): string | null {
  return currentToken;
}

export function setAccessToken(token: string | null): void {
  currentToken = token;
  listeners.forEach((listener) => listener(token));
}

export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
