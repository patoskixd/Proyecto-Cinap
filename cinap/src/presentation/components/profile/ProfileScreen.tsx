"use client";
import { useProfile } from "./hooks/useProfile";
import { useTelegram } from "./hooks/useTelegram";

export default function ProfileScreen() {
  const { data, error, loading } = useProfile();
  const { state: tg, busy, link } = useTelegram();

  if (loading) return <div className="p-6">Cargando…</div>;
  if (error || !data) return <div className="p-6 text-red-600">{error ?? "Sin datos"}</div>;
  const { user, stats } = data;

  const btnLabel = tg.linked
    ? `Vinculado${tg.username ? ` como @${tg.username}` : ""}`
    : (busy ? "Conectando..." : "Vincular Telegram");

  return (
    <section className="max-w-6xl mx-auto p-6">
      <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{user.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{user.role}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {tg.linked ? `Telegram vinculado${tg.username ? ` (@${tg.username})` : ""}` : "Verificado"}
              </span>
            </div>
            <p className="mt-2 text-slate-600">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={link}
            disabled={busy || tg.linked}
            className="group relative overflow-hidden rounded-full border-2 border-sky-400 px-5 py-2.5 text-sky-700 hover:text-white transition-all duration-300 disabled:opacity-60"
          >
            <span className="absolute inset-0 -z-10 translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-sky-500 to-blue-600 transition-transform duration-300" />
            {btnLabel}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 text-white p-5 shadow">
            <div className="text-3xl font-bold">{stats.completed}</div>
            <div className="text-sm opacity-90">Asesorías Completadas</div>
          </div>
          <div className="rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 text-white p-5 shadow">
            <div className="text-3xl font-bold">{stats.canceled}</div>
            <div className="text-sm opacity-90">Canceladas</div>
          </div>
        </div>
      </div>
    </section>
  );
}
