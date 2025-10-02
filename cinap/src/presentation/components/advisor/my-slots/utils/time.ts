const WORK_START = 9;
const WORK_END = 18;

export function endTime(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + duration;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateEs(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, (mo ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
export function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function isWeekendISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const wd = dt.getDay();
  return wd === 0 || wd === 6;
}
export function isPastISO(iso: string) {
  return iso < todayLocalISO();
}
export function clampToWorkingHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (h < WORK_START) return `${String(WORK_START).padStart(2, "0")}:00`;
  if (h > WORK_END) return `${String(WORK_END).padStart(2, "0")}:00`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
export function validStartWithinShift(hhmm: string, duration: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const start = h * 60 + m;
  const end = start + duration;
  return start >= WORK_START * 60 && end <= WORK_END * 60;
}
