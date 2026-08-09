import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * This app's own session — separate from any cookie Blocks sets. It exists so the
 * OIDC dance (and the Blocks refresh-token cookie jar it produces) stays entirely
 * server-side; only a short-lived Blocks access token ever reaches the browser,
 * fetched on demand via /api/auth/session and attached as an Authorization header.
 */

const COOKIE_NAME = "bwb_session";
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET is not set — see .env.local");
}
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  /** Raw `name=value; name2=value2` Cookie header to present back to Blocks (idp session/refresh cookies). */
  blocksCookie: string;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  /** Explicit refresh_token this project's /iam/v4/oidc/token expects on the refresh grant. */
  refreshToken?: string;
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  return decrypt(cookie);
}

export async function setSession(payload: SessionPayload) {
  const jwt = await encrypt(payload);
  (await cookies()).set(COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}
