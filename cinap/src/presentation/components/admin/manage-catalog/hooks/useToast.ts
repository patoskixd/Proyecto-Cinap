import { useState } from "react";

export type ToastTone = "success" | "error" | "info";
export type ToastState = { message: string; tone: ToastTone } | null;

export function useToast(ttlMs = 2600) {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, tone: ToastTone = "info") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), ttlMs);
  };

  return { toast, showToast };
}
