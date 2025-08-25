import type { SlotRule, WeekdayId } from "@domain/slots";

/** Reglas que pueden traer meta de UI (fecha exacta) */
export type UIRule = SlotRule & { isoDate?: string };

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const weekdayFromISO = (iso: string): WeekdayId | null => {
  // usando fecha local (evita desfases por zona horaria)
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const js = dt.getDay(); // 0..6 (dom..sáb)
  // Dom(0), Sáb(6) => null; L-V => monday..friday
  const map: Array<WeekdayId | null> = [
    null,
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    null,
  ];
  return map[js] ?? null;
};

/**
 * Normaliza/valida reglas:
 * - Descarta rangos inválidos (inicio >= fin)
 * - Descarta fines de semana cuando viene isoDate
 * - "Reemplaza" por fecha: si hay varias reglas con la MISMA fecha, gana la última
 * - Si llegan reglas por día (sin isoDate), también queda la última por día
 */
export function normalizeSchedules(
  rules: UIRule[]
): { merged: UIRule[]; errors: string[] } {
  const errors: string[] = [];

  const byDate = new Map<string, UIRule>();      // key: YYYY-MM-DD
  const byWeekday = new Map<WeekdayId, UIRule>(); // key: monday..friday

  for (const r of rules) {
    const start = toMin(r.startTime);
    const end = toMin(r.endTime);
    if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
      errors.push(`Rango inválido: ${r.startTime} - ${r.endTime}`);
      continue;
    }

    if (r.isoDate) {
      const day = weekdayFromISO(r.isoDate);
      if (!day) {
        // fin de semana o fecha inválida → lo ignoramos
        continue;
      }
      // la última regla para esa fecha "reemplaza" a la anterior
      byDate.set(r.isoDate, { ...r, day });
    } else {
      // por día de semana (sin fecha exacta)
      byWeekday.set(r.day, r);
    }
  }

  // salida ordenada (fecha asc y luego por día)
  const merged: UIRule[] = [
    ...Array.from(byDate.values()).sort((a, b) =>
      (a.isoDate ?? "").localeCompare(b.isoDate ?? "")
    ),
    ...Array.from(byWeekday.values()),
  ];

  return { merged, errors };
}
