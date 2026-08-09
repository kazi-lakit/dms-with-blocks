"use client";

import { useState } from "react";
import { Folder, FolderInput } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { useDrive } from "@/components/providers/drive-provider";
import { useDirectoryChildren } from "@/lib/blocks/drive-hooks";
import type { DirectoryChild } from "@/lib/blocks/files";

interface DestinationPickerDialogProps {
  entry: DirectoryChild;
  mode: "move" | "copy";
  onConfirm: (targetDirectoryId: string) => void;
  onClose: () => void;
  confirming: boolean;
}

/** Browse-and-pick a target folder, for Move/Copy. Starts at the drive root, folder-only listing. */
export function DestinationPickerDialog({ entry, mode, onConfirm, onClose, confirming }: DestinationPickerDialogProps) {
  const { driveId } = useDrive();
  const [trail, setTrail] = useState<Crumb[]>([]);
  const currentFolderId = trail.at(-1)?.id ?? driveId ?? "";

  const { data: page, isPending } = useDirectoryChildren(currentFolderId, "");
  // Exclude the entry itself from the listing so you can't navigate into (or pick) the
  // folder you're moving — deeper descendants aren't guarded against, there's no tree
  // lookup to check ancestry against.
  const folders = (page?.entries ?? []).filter((e) => e.isFolder && e.id !== entry.id);

  function openFolder(folder: DirectoryChild) {
    setTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
  }

  function navigateTo(index: number) {
    setTrail((prev) => (index < 0 ? [] : prev.slice(0, index + 1)));
  }

  return (
    <Modal onClose={onClose} className="max-w-md">
      <h2 className="mb-1 text-lg font-semibold text-ink">
        {mode === "move" ? "Move" : "Copy"} &ldquo;{entry.name}&rdquo;
      </h2>
      <p className="mb-4 text-sm text-steel">Choose a destination folder.</p>

      <Breadcrumbs trail={trail} onNavigate={navigateTo} />

      <div className="mt-2 flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-md border border-hairline p-1">
        {isPending ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : folders.length > 0 ? (
          folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => openFolder(folder)}
              className="flex items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-ink hover:bg-surface"
            >
              <Folder size={16} className="text-steel" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))
        ) : (
          <p className="px-2.5 py-6 text-center text-sm text-muted">No subfolders here.</p>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={() => onConfirm(currentFolderId)} disabled={confirming}>
          {confirming ? <Spinner className="h-4 w-4" /> : <FolderInput size={15} />}
          {mode === "move" ? "Move here" : "Copy here"}
        </Button>
      </div>
    </Modal>
  );
}
