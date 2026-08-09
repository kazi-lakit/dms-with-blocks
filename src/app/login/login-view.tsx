"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code_or_state: "The sign-in link was incomplete. Please try again.",
  callback_failed: "We couldn't complete sign-in. Please try again.",
  login_failed: "We couldn't start sign-in. Please try again in a moment.",
};

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/drive");
  }, [status, router]);

  const error = params.get("error");
  const activated = params.get("activated");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-hero-sky relative flex flex-1 items-center justify-center px-6 py-24">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm bg-canvas/95 shadow-xl backdrop-blur">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Vault</h1>
            <p className="text-sm text-steel">Sign in to access your files</p>
          </div>

          {activated && (
            <p className="mb-4 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink">
              Account activated — you can sign in now.
            </p>
          )}
          {error && (
            <p className="mb-4 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-brand-error">
              {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
            </p>
          )}

          {status === "loading" ? (
            <div className="flex items-center justify-center py-2.5">
              <Spinner />
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                // Full navigation, not client-side routing: this hits a Route Handler
                // that 302s to Blocks' hosted login on a different origin.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/api/auth/login";
              }}
            >
              Sign in with SSO
            </Button>
          )}

          <p className="mt-6 text-center text-xs text-muted">
            Have an invite link instead? Use the activation link from your email.
          </p>
        </Card>
      </div>
    </div>
  );
}
