"use client";

import { ReactNode } from "react";
import clsx from "clsx";

export function Modal({
  onClose,
  children,
  className,
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={clsx("w-full max-w-sm rounded-lg border border-hairline bg-canvas p-6 shadow-xl", className)}>
        {children}
      </div>
    </div>
  );
}
