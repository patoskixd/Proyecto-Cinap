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
    <div className="fixed right-5 top-24 z-[60] max-w-xs rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-xl">
      {msg}
    </div>
  );
}
