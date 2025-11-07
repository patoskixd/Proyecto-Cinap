import Link from "next/link";

import type { ReservationTab } from "@/application/teacher/asesorias/ports/ReservationsRepo";

type TabsConfig = {
  active: ReservationTab;
  totals: Record<ReservationTab, number>;
  onSelect: (tab: ReservationTab) => void;
};

type Props = {
  title: string;
  subtitle: string;
  cta?: { href: string; label: string };
  tabs?: TabsConfig;
};

export default function ReservationsHeader({ title, subtitle, cta, tabs }: Props) {
  return (
    <>
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">{title}</h1>
            <p className="mt-1 text-blue-700">{subtitle}</p>
          </div>
          {cta ? (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-3 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
              {cta.label}
            </Link>
          ) : null}
        </div>
      </div>

      {tabs ? (
        <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-blue-200 bg-white/70 p-1 shadow-lg backdrop-blur">
          <button
            onClick={() => tabs.onSelect("upcoming")}
            className={[
              "inline-flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-semibold transition-all",
              tabs.active === "upcoming"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-blue-700 hover:bg-blue-50",
            ].join(" ")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Proximas
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                tabs.active === "upcoming" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800",
              ].join(" ")}
            >
              {tabs.totals.upcoming}
            </span>
          </button>
          <button
            onClick={() => tabs.onSelect("past")}
            className={[
              "ml-1 inline-flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-semibold transition-all",
              tabs.active === "past"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-blue-700 hover:bg-blue-50",
            ].join(" ")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Historial
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                tabs.active === "past" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800",
              ].join(" ")}
            >
              {tabs.totals.past}
            </span>
          </button>
        </div>
      ) : null}
    </>
  );
}

