"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Variant = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  message: string;
  variant: Variant;
  ttlMs: number;
};

type ToastCtx = {
  push: (message: string, variant?: Variant, ttlMs?: number) => void;
};

const ToastContext = createContext<ToastCtx>({ push: () => {} });

let externalPush: ToastCtx["push"] = () => {};
export function notify(message: string, variant?: Variant, ttlMs = 3500) {
  // Autodetección por texto en ES si no nos pasan variante
  if (!variant) {
    const m = (message || "").toLowerCase();

    // rojo: eliminar / cancelación
    if (
      /\belimin(a|ado|ada|ar|ó|aste|amos|aron)\b/.test(m) ||
      /\bcancel(a|ado|ada|ar|ó|aste|amos|aron)\b/.test(m) ||
      /\b(eliminar|cancelar)\b/.test(m) ||
      /\b(error|erróneo|errónea|falló|fallido|fallar|fallas|fallamos|fallaron)\b/.test(m) ||
      /\b(bloqueado|bloquear|bloqueo)\b/.test(m) ||
      /\b(desactivada|duplicado|duplicar|error|duplicado|duplicada|desact|inac|inactivo)\b/.test(m) ||
      /\b(fall(ó|o|ar|ido|ida|aste|amos|aron)|rechaz(a|asesoria cancelado|cancelado|Canceladas|Cance|cancelada|Asesoria cancelada|asesoria cancelada))\b/.test(m)
    ) {
      variant = "error";
    }
    // verde: crear/editar/actualizar/activar/reactivar/guardar
    else if (/\b(crea|guard|edit|actualiz|activ|reactiv)\b/.test(m)||
       /\b(agreg|añad|nuev|exitos[oa]|éxito|correctamente)\b/.test(m) ||
        /\b(crear|guardar|editar|actualizar|activar|reactivar|creada|creado)\b/.test(m)
    
  ) {
      variant = "success";
    } else {
      variant = "info";
    }
  }
  externalPush(message, variant, ttlMs);
}

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const push = useCallback<ToastCtx["push"]>((message, variant = "info", ttlMs = 3500) => {
    const id = idRef.current++;
    const item: ToastItem = { id, message, variant, ttlMs };
    setToasts((prev) => [...prev, item]);
    // auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ttlMs);
  }, []);

  useEffect(() => {
    externalPush = push;
    return () => {
      externalPush = () => {};
    };
  }, [push]);

  const value = useMemo(() => ({ push }), [push]);

  const palette: Record<Variant, string> = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    info: "bg-slate-50 border-slate-200 text-slate-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
  };
  const dot: Record<Variant, string> = {
    success: "bg-emerald-500",
    error: "bg-rose-500",
    info: "bg-slate-500",
    warning: "bg-amber-500",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[280px] max-w-[420px] rounded-xl border shadow-md px-4 py-3 flex items-start gap-3 ${palette[t.variant]}`}
            role="status"
            aria-live="polite"
          >
            <span className={`mt-1 h-2 w-2 rounded-full ${dot[t.variant]}`} />
            <div className="text-sm leading-5 font-medium">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
