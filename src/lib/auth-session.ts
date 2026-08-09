import "server-only";
import { getSession, setSession, clearSession, type SessionPayload } from "@/lib/session";
import { refreshAccessToken } from "@/lib/blocks-oidc";

const EXPIRY_SKEW_MS = 30_000;

export interface ActiveToken {
  accessToken: string;
  accessTokenExpiresAt: number;
}

/**
 * Returns a bearer access token that's good for at least a few more seconds, refreshing
 * it from the stored Blocks cookie jar when the current one is missing or stale. Used by
 * both /api/auth/session (bootstrap) and /api/auth/refresh (401-retry from the browser).
 */
export async function ensureFreshToken(options: { force?: boolean } = {}): Promise<ActiveToken | null> {
  const session = await getSession();
  if (!session) return null;

  const isFresh =
    !options.force &&
    session.accessToken &&
    session.accessTokenExpiresAt &&
    session.accessTokenExpiresAt - EXPIRY_SKEW_MS > Date.now();

  if (isFresh) {
    return { accessToken: session.accessToken!, accessTokenExpiresAt: session.accessTokenExpiresAt! };
  }

  try {
    const refreshed = await refreshAccessToken(session.blocksCookie, session.refreshToken);
    const payload: SessionPayload = { ...refreshed };
    await setSession(payload);
    return { accessToken: refreshed.accessToken, accessTokenExpiresAt: refreshed.accessTokenExpiresAt };
  } catch {
    await clearSession();
    return null;
  }
}
