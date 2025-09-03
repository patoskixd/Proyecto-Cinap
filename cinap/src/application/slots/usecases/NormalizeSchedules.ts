import type { SlotRule, WeekdayId } from "@domain/slots";


export type UIRule = SlotRule & { isoDate?: string };

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const weekdayFromISO = (iso: string): WeekdayId | null => {

  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const js = dt.getDay(); 

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

export function normalizeSchedules(
  rules: UIRule[]
): { merged: UIRule[]; errors: string[] } {
  const errors: string[] = [];

  const byDate = new Map<string, UIRule>();    
  const byWeekday = new Map<WeekdayId, UIRule>(); 
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
        continue;
      }
      byDate.set(r.isoDate, { ...r, day });
    } else {
      byWeekday.set(r.day, r);
    }
  }

  const merged: UIRule[] = [
    ...Array.from(byDate.values()).sort((a, b) =>
      (a.isoDate ?? "").localeCompare(b.isoDate ?? "")
    ),
    ...Array.from(byWeekday.values()),
  ];

  return { merged, errors };
}
