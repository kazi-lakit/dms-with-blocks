"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewFolderDialog({
  onCreate,
  onClose,
  creating,
}: {
  onCreate: (name: string) => void;
  onClose: () => void;
  creating: boolean;
}) {
  const [name, setName] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim()) onCreate(name.trim());
  }

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold text-ink">New folder</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input placeholder="Folder name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
