import React from "react";


let GLOBAL_SETTER: ((msg: string | null) => void) | null = null;

export function notify(message: string) {
  GLOBAL_SETTER?.(message);
}

export default function Toast() {
  const [msg, setMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    GLOBAL_SETTER = setMsg;
    return () => { GLOBAL_SETTER = null; };
  }, []);

  React.useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2400);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div className="fixed right-5 top-24 z-[60] max-w-sm rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-5 py-4 font-medium text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-300">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{msg}</span>
      </div>
    </div>
  );
}
