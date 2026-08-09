"use client";

import { useState } from "react";
import { MoreVertical, Download, FolderInput, Copy, RotateCcw, Share2, Trash2, XCircle } from "lucide-react";
import type { DirectoryChild } from "@/lib/blocks/files";
import { formatBytes, formatDate } from "@/lib/format";
import { EntryIcon } from "./file-icon";

interface FileGridProps {
  entries: DirectoryChild[];
  onOpenFolder: (entry: DirectoryChild) => void;
  onDownload: (entry: DirectoryChild) => void;
  /** Omit any of these to render a read-only-ish grid — e.g. content shared with you, where you may not hold Manage. */
  onShare?: (entry: DirectoryChild) => void;
  onMove?: (entry: DirectoryChild) => void;
  /** Files only — there's no CopyDirectory endpoint, so this is never offered for folders. */
  onCopy?: (entry: DirectoryChild) => void;
  /** Soft delete (archives to Trash). Mutually exclusive with onRestore/onPurge in practice — those are the Trash view's own actions. */
  onDelete?: (entry: DirectoryChild) => void;
  onRestore?: (entry: DirectoryChild) => void;
  /** Permanent, irreversible removal from Trash. */
  onPurge?: (entry: DirectoryChild) => void;
}

export function FileGrid({
  entries,
  onOpenFolder,
  onDownload,
  onShare,
  onMove,
  onCopy,
  onDelete,
  onRestore,
  onPurge,
}: FileGridProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  function openOrDownload(entry: DirectoryChild) {
    if (entry.isFolder) onOpenFolder(entry);
    else onDownload(entry);
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center text-steel">
        <p className="text-sm">This folder is empty.</p>
        <p className="text-xs text-muted">Drag files here, or use Upload above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          role="button"
          tabIndex={0}
          onClick={() => openOrDownload(entry)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            openOrDownload(entry);
          }}
          className="group relative flex flex-col gap-2 rounded-lg border border-hairline bg-canvas p-3.5 hover:border-stone hover:shadow-sm"
        >
          <div className="flex items-start justify-between">
            <EntryIcon isFolder={entry.isFolder} name={entry.name} className="h-8 w-8 text-steel" />
            {(!entry.isFolder || onShare || onMove || onDelete || onRestore || onPurge) && (
              // Stops every click inside — the toggle button and each menu item — from
              // bubbling up to the tile's own onClick above (which would otherwise also
              // fire open/download at the same time as, say, Delete).
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setMenuFor(menuFor === entry.id ? null : entry.id)}
                  className="rounded-sm p-1 text-muted opacity-0 hover:bg-surface hover:text-ink group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>
                {menuFor === entry.id && (
                  <div
                    onMouseLeave={() => setMenuFor(null)}
                    className="absolute right-0 top-8 z-10 w-40 rounded-md border border-hairline bg-canvas p-1 shadow-lg"
                  >
                    {!entry.isFolder && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onDownload(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                      >
                        <Download size={14} /> Download
                      </button>
                    )}
                    {onShare && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onShare(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                      >
                        <Share2 size={14} /> Share
                      </button>
                    )}
                    {onMove && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onMove(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                      >
                        <FolderInput size={14} /> Move
                      </button>
                    )}
                    {onCopy && !entry.isFolder && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onCopy(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    )}
                    {onRestore && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onRestore(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                      >
                        <RotateCcw size={14} /> Restore
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onDelete(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-brand-error hover:bg-surface"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                    {onPurge && (
                      <button
                        onClick={() => {
                          setMenuFor(null);
                          onPurge(entry);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm text-brand-error hover:bg-surface"
                      >
                        <XCircle size={14} /> Delete forever
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <span className="truncate text-sm font-medium text-ink" title={entry.name}>
            {entry.name}
          </span>
          <p className="text-xs text-muted">
            {entry.isFolder ? formatDate(entry.createdDate) : `${formatBytes(entry.sizeInBytes)} · ${formatDate(entry.createdDate)}`}
          </p>
        </div>
      ))}
    </div>
  );
}
