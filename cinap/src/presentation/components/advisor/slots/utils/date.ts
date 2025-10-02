import type { WeekdayId } from "@domain/slots";

export const WEEKDAYS_UI = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const weekIndexMon0 = (d: Date) => (d.getDay() + 6) % 7;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const today = startOfDay(new Date());
export const isPastDate = (d: Date) => startOfDay(d) < today;

export function buildMonthGrid(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = weekIndexMon0(first);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function weekdayFromDate(d: Date): WeekdayId | null {
  const w = weekIndexMon0(d);
  return w > 4 ? null : (["monday","tuesday","wednesday","thursday","friday"][w] as WeekdayId);
}

export const monthLabelES = (d: Date) => d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

export function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function dateFromLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
export const isSameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatEsDate = (iso: string) =>
  dateFromLocalISO(iso)
    .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "");
