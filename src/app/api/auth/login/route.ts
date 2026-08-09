import { NextRequest, NextResponse } from "next/server";
import { initiateLogin } from "@/lib/blocks-oidc";
import { originUrl } from "@/lib/request-origin";

const REDIRECT_URI = process.env.BLOCKS_REDIRECT_URI!;

// Starts the Blocks hosted SSO flow (blocks-iam-sso-oidc-implementation, login-flow.md
// steps 1-2), entirely from the backend: fetch the authorize URL, then redirect here.
export async function GET(request: NextRequest) {
  try {
    const authorizeUrl = await initiateLogin(REDIRECT_URI);
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : "login_failed";
    return NextResponse.redirect(originUrl(request, `/login?error=${encodeURIComponent(message)}`));
  }
}
