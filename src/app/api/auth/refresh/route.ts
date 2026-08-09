import { NextResponse } from "next/server";
import { ensureFreshToken } from "@/lib/auth-session";

// Called by the browser's Blocks fetch wrapper after a 401, to mint a new bearer token
// before retrying the original request once. Always forces a refresh — a 401 means the
// token we thought was fresh no longer is.
export async function POST() {
  const token = await ensureFreshToken({ force: true });
  if (!token) {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
  return NextResponse.json({
    loggedIn: true,
    accessToken: token.accessToken,
    expiresAt: token.accessTokenExpiresAt,
  });
}
