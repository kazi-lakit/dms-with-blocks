"use client";

/**
 * A minimal pub-sub toast queue — not a React hook, so it's callable from plain
 * functions too (e.g. src/lib/blocks/http.ts, which surfaces Blocks API business
 * errors like `{isSuccess:false, errors:{...}}` as toasts). `Toaster` subscribes and
 * renders; call `toast.error(...)` etc. from anywhere.
 */

export type ToastVariant = "error" | "success" | "info";

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function push(variant: ToastVariant, message: string, duration = 6000): number {
  const id = nextId++;
  toasts = [...toasts, { id, variant, message }];
  emit();
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  error: (message: string) => push("error", message),
  success: (message: string) => push("success", message),
  info: (message: string) => push("info", message),
  dismiss,
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}
