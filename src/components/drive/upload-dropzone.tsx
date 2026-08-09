"use client";

import { ReactNode, useState } from "react";
import { UploadCloud } from "lucide-react";

export function UploadDropzone({ onFiles, children }: { onFiles: (files: File[]) => void; children: ReactNode }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className="relative flex flex-1 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-green bg-brand-green-soft/20">
          <UploadCloud className="text-brand-green-deep" size={32} />
          <p className="text-sm font-medium text-ink">Drop to upload</p>
        </div>
      )}
    </div>
  );
}
