import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForSession } from "@/lib/blocks-oidc";
import { originUrl } from "@/lib/request-origin";
import { setSession } from "@/lib/session";

// IAM redirects the browser here after hosted login (login-flow.md step 3). We finish
// the exchange server-side (step 4) and hand the browser only a bearer access token,
// via this app's own session cookie — never the Blocks session cookie itself.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oidcError = request.nextUrl.searchParams.get("error");

  if (oidcError) {
    return NextResponse.redirect(originUrl(request, `/login?error=${encodeURIComponent(oidcError)}`));
  }
  if (!code || !state) {
    return NextResponse.redirect(originUrl(request, "/login?error=missing_code_or_state"));
  }

  try {
    const bundle = await exchangeCodeForSession(code, state);
    await setSession(bundle);
    return NextResponse.redirect(originUrl(request, "/drive"));
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(originUrl(request, `/login?error=${encodeURIComponent(message)}`));
  }
}
