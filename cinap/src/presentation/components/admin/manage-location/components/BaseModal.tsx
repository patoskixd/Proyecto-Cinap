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
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full overflow-hidden rounded-2xl bg-white shadow-xl ${maxW}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md text-xl text-neutral-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
