import React from "react";
import type { ToastState } from "../hooks/useToast";

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed right-5 top-24 z-[60] max-w-sm rounded-xl px-5 py-4 font-medium text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 ${
        toast.tone === "success" 
          ? "bg-gradient-to-r from-green-500 to-green-600" 
          : toast.tone === "error" 
          ? "bg-gradient-to-r from-red-500 to-red-600" 
          : "bg-gradient-to-r from-blue-600 to-blue-700"
      }`}
    >
      <div className="flex items-center gap-3">
        {toast.tone === "success" && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {toast.tone === "error" && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {(!toast.tone || toast.tone === "info") && (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
