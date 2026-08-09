"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface DriveSetupPromptProps {
  onSetup: () => Promise<void>;
  error: string | null;
}

/** Shown once, the first time a user signs in with no BlxDrive record yet. */
export function DriveSetupPrompt({ onSetup, error }: DriveSetupPromptProps) {
  const [pending, setPending] = useState(false);

  async function handleSetup() {
    setPending(true);
    try {
      await onSetup();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-canvas p-8 text-center shadow-sm">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary">
          <FolderPlus size={20} />
        </span>
        <h1 className="text-lg font-semibold text-ink">Set up your drive</h1>
        <p className="mt-2 text-sm text-steel">
          You don&apos;t have a drive yet. We&apos;ll create one now so you can start storing files.
        </p>
        {error && <p className="mt-3 text-sm text-brand-error">{error}</p>}
        <Button className="mt-6 w-full" onClick={handleSetup} disabled={pending}>
          {pending ? <Spinner className="h-4 w-4" /> : <FolderPlus size={15} />}
          {pending ? "Setting up…" : "Set up my drive"}
        </Button>
      </div>
    </div>
  );
}
