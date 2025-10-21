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
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} // click-outside
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200 ${WIDTH[size]}`}>
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="flex items-start gap-4 px-6 py-4 relative z-10">
            <h3 className="flex-1 text-lg font-semibold leading-snug text-white break-words">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 shrink-0 self-start"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
