import React from "react";

export default function BaseModal({
  title,
  onClose,
  children,
  maxW = "max-w-xl",
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  maxW?: "max-w-xl" | "max-w-2xl" | "max-w-4xl" | "max-w-6xl";
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 ${maxW}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-white hover:bg-white/20 transition-colors duration-200 flex items-center justify-center"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
