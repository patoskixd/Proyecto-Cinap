export const toLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} horas`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? "s" : ""}`;
};

export const prettyDateTime = (dateISO: string, time: string) => {
  const d = toLocalDate(dateISO);
  const s = d
    .toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(",", "");
  const [hh, mm] = time.split(":");
  const hhNum = Number(hh);
  const isPM = hhNum >= 12;
  const hh12 = ((hhNum + 11) % 12) + 1;
  return `${s} - ${String(hh12)}:${mm} ${isPM ? "PM" : "AM"}`;
};
