import React, { useEffect } from "react";

type Size = "sm" | "md" | "lg" | "xl";
const WIDTH: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export default function BaseModal({
  title,
  children,
  onClose,
  size = "md",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: Size;
}) {
  // Cerrar con Escape
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} // click-outside
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full overflow-hidden rounded-2xl bg-white shadow-xl ${WIDTH[size]}`}>
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
