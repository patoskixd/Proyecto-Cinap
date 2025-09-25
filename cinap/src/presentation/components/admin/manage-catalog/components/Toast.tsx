import React from "react";
import type { ToastState } from "../hooks/useToast";

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed right-5 top-24 z-[60] max-w-xs rounded-xl px-4 py-3 font-semibold text-white shadow-xl ${
        toast.tone === "success" ? "bg-emerald-600" : toast.tone === "error" ? "bg-rose-600" : "bg-blue-600"
      }`}
    >
      {toast.message}
    </div>
  );
}
