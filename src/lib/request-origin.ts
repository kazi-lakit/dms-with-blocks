import type { NextRequest } from "next/server";

/**
 * Builds an absolute URL against the origin the browser actually requested, read
 * straight off the `Host` header (with `x-forwarded-host` preferred, for local
 * reverse-proxy setups). `request.url`/`request.nextUrl` were observed falling back to
 * `localhost` for requests to a custom local domain in dev — the callback/login routes
 * redirect the browser (not just this server), so getting the host wrong sends the
 * user to a different origin than the one that just set their session cookie.
 */
export function originUrl(request: NextRequest, path: string): URL {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const base = host ? `${protocol}://${host}` : request.nextUrl.origin;
  return new URL(path, base);
}
