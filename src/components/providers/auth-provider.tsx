"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { onAccessTokenChange, setAccessToken } from "@/lib/blocks/token-store";
import { usersApi, type BlocksUser } from "@/lib/blocks/users";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: BlocksUser | null;
  /** Re-runs the session bootstrap — call after activation or when you suspect the token went stale. */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<BlocksUser | null>(null);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) {
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      const data = (await res.json()) as { accessToken: string };
      setAccessToken(data.accessToken);
      const me = await usersApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    // Intentional: bootstrap the session once on mount by calling the Next.js backend.
    // This is the documented Next.js session-bootstrap pattern (fetch, then setState in
    // the async continuation) — there's no external subscription to attach here instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    // blocksFetch/blocksFilesFetch (src/lib/blocks/http.ts) transparently refresh the
    // access token on a 401 and retry — the user never sees that. This only fires when
    // that refresh itself fails (the Blocks refresh token is expired/revoked), which is
    // the one case that's actually "logged out": drop to unauthenticated so the (app)
    // layout's guard redirects to /login, instead of leaving the UI on broken queries.
    return onAccessTokenChange((token) => {
      if (token === null && statusRef.current === "authenticated") {
        setUser(null);
        setStatus("unauthenticated");
      }
    });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, refresh: bootstrap, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
