import { NextResponse } from "next/server";
import { ensureFreshToken } from "@/lib/auth-session";

// The frontend calls this on load to bootstrap: do we have a session, and if so, what's
// a currently-valid bearer token? Returns 401 (no body assumptions) when logged out.
export async function GET() {
  const token = await ensureFreshToken();
  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
  return NextResponse.json({
    loggedIn: true,
    accessToken: token.accessToken,
    expiresAt: token.accessTokenExpiresAt,
  });
}
