import "server-only";

/**
 * Server-side half of the Blocks hosted SSO/OIDC flow (blocks-iam-sso-oidc-implementation).
 *
 * Blocks' `/idp/callback` is designed for a browser to call directly — it finalizes the
 * authorization code and answers by setting HttpOnly session/refresh cookies scoped to
 * whatever host called it. Here that caller is *this server*, not the browser, so those
 * cookies land on us. We keep them (as a plain `Cookie:` header value, never shipped to
 * the client) and use them to mint short-lived bearer access tokens via the OIDC refresh
 * grant — which the browser then uses as `Authorization: Bearer <token>` on direct calls
 * to Blocks services. This is what lets the app avoid ever storing a Blocks session
 * cookie in the browser (and the same-site/HTTPS-on-real-domain constraints that come
 * with it — see blocks-frontend-local-https) while still honoring "OIDC is handled by
 * the Next.js backend, the frontend only carries a bearer token".
 */

const API_URL = process.env.BLOCKS_API_URL!;
const PROJECT_KEY = process.env.BLOCKS_PROJECT_KEY!;
const CLIENT_ID = process.env.BLOCKS_OIDC_CLIENT_ID!;
const CLIENT_SECRET = process.env.BLOCKS_OIDC_CLIENT_SECRET!;

export interface BlocksTokenBundle {
  blocksCookie: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  /**
   * This project's `/iam/v4/oidc/token` is a standard RFC 6749 token endpoint — the
   * refresh grant expects `refresh_token` as an explicit form field, not just the
   * session cookie. Kept server-side only, alongside `blocksCookie`, never sent to the
   * browser.
   */
  refreshToken?: string;
}

/** Merge new Set-Cookie entries into an existing `name=value; name2=value2` header string. */
function mergeCookies(existing: string, setCookieHeaders: string[]): string {
  const jar = new Map<string, string>();
  for (const part of existing.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) jar.set(name, rest.join("="));
  }
  for (const header of setCookieHeaders) {
    const [pair] = header.split(";"); // drop attributes (Path, Secure, Expires, ...)
    const [name, ...rest] = pair.trim().split("=");
    if (name) jar.set(name, rest.join("="));
  }
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function basicAuthHeader() {
  return "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

/** Ask Blocks for the hosted-login authorize URL. Step 1 of login-flow.md — a data fetch, not a redirect. */
export async function initiateLogin(redirectUri: string): Promise<string> {
  const url = new URL(`${API_URL}/iam/v4/idp/initiate`);
  url.searchParams.set("x-blocks-key", PROJECT_KEY);
  url.searchParams.set("clientId", CLIENT_ID);
  url.searchParams.set("redirectUri", redirectUri);

  const res = await fetch(url, { headers: { "x-blocks-key": PROJECT_KEY } });
  if (!res.ok) throw new Error(`idp/initiate failed: ${res.status}`);
  const data = (await res.json()) as { redirect_uri?: string };
  if (!data.redirect_uri) throw new Error("idp/initiate returned no redirect_uri");
  return data.redirect_uri;
}

/**
 * Exchange the authorization code for a Blocks session, entirely server-side, then mint
 * a bearer access token from the resulting session. Step 4 of login-flow.md, run here
 * instead of in the browser.
 */
export async function exchangeCodeForSession(code: string, state: string): Promise<BlocksTokenBundle> {
  const callbackUrl = new URL(`${API_URL}/iam/v4/idp/callback`);
  callbackUrl.searchParams.set("code", code);
  callbackUrl.searchParams.set("state", state);

  const callbackRes = await fetch(callbackUrl, {
    headers: { "x-blocks-key": PROJECT_KEY },
  });
  if (!callbackRes.ok) {
    throw new Error(`idp/callback failed: ${callbackRes.status}`);
  }

  const blocksCookie = mergeCookies("", callbackRes.headers.getSetCookie());

  // Some projects return tokens directly on the callback response; use them if present.
  const callbackBody = (await callbackRes.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (callbackBody.access_token) {
    return {
      blocksCookie,
      accessToken: callbackBody.access_token,
      accessTokenExpiresAt: Date.now() + (callbackBody.expires_in ?? 300) * 1000,
      refreshToken: callbackBody.refresh_token,
    };
  }

  // Otherwise mint one from the session the callback just established. No explicit
  // refresh_token yet — this first call relies on the Cookie header, and its response
  // is where we actually pick one up for every refresh after this.
  return refreshAccessToken(blocksCookie);
}

/**
 * Renew the bearer access token. `POST /iam/v4/oidc/token` is a standard RFC 6749 token
 * endpoint (confirmed live against this project's swagger) — the refresh grant needs
 * `refresh_token` as an explicit form field, not just the session cookie, so we send
 * both: the cookie for session continuity, and the explicit token because that's what
 * this endpoint actually keys off. Response may rotate the refresh token; keep whatever
 * comes back, falling back to the one we sent if the endpoint doesn't rotate it.
 */
export async function refreshAccessToken(blocksCookie: string, refreshToken?: string): Promise<BlocksTokenBundle> {
  const form = new URLSearchParams({ grant_type: "refresh_token", client_id: CLIENT_ID });
  if (refreshToken) form.set("refresh_token", refreshToken);

  const res = await fetch(`${API_URL}/iam/v4/oidc/token`, {
    method: "POST",
    headers: {
      "x-blocks-key": PROJECT_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
      Cookie: blocksCookie,
    },
    body: form,
  });

  const rotatedCookie = mergeCookies(blocksCookie, res.headers.getSetCookie());

  if (!res.ok) {
    throw new Error(`oidc/token refresh failed: ${res.status}`);
  }
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) {
    throw new Error("oidc/token refresh returned no access_token");
  }

  return {
    blocksCookie: rotatedCookie,
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? refreshToken,
    accessTokenExpiresAt: Date.now() + (body.expires_in ?? 300) * 1000,
  };
}

/** Best-effort server-side logout — revokes the Blocks session behind our cookie jar. */
export async function logoutBlocksSession(blocksCookie: string): Promise<void> {
  try {
    await fetch(`${API_URL}/iam/v4/auth/Logout`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-blocks-key": PROJECT_KEY,
        Cookie: blocksCookie,
      },
      body: JSON.stringify({}),
    });
  } catch {
    // Logout is best-effort — the local session cookie is cleared regardless.
  }
}
