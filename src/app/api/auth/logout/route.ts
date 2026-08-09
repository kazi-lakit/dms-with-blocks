import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/session";
import { logoutBlocksSession } from "@/lib/blocks-oidc";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logoutBlocksSession(session.blocksCookie);
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
