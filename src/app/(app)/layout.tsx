"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { DriveProvider, useDrive } from "@/components/providers/drive-provider";
import { DriveSetupPrompt } from "@/components/drive/drive-setup-prompt";
import { Sidebar } from "@/components/drive/sidebar";
import { UserMenu } from "@/components/drive/user-menu";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // DriveProvider needs the signed-in user, so it only mounts once auth is settled.
  return (
    <DriveProvider>
      <DriveGate>{children}</DriveGate>
    </DriveProvider>
  );
}

/** Resolves the user's drive before showing the drive chrome — see DriveProvider. */
function DriveGate({ children }: { children: React.ReactNode }) {
  const { status, error, setupDrive } = useDrive();

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (status === "needs-setup" || status === "error") {
    return <DriveSetupPrompt onSetup={setupDrive} error={error} />;
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-none items-center justify-end gap-2 border-b border-hairline px-6">
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
