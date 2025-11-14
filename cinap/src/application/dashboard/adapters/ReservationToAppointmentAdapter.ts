import type { Appointment, AppointmentStatus } from "@/domain/appointment";

// Utilidades
const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const pick = (...vals: unknown[]) => vals.map(s).find(Boolean);

function labelForDate(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Hoy";
  if (same(d, tomorrow)) return "Mañana";
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}
const timeStr = (d?: Date) =>
  d ? d.toLocaleTimeString("es-CL",{ hour:"2-digit", minute:"2-digit" }) : "";

export function backendAppointmentToApp(apt: any): Appointment {
  // fechas
  const start =
    apt.inicio ? new Date(apt.inicio) :
    apt.start  ? new Date(apt.start)  :
    apt.fechaHora ? new Date(apt.fechaHora) : undefined;

  // estado
  const raw = String(apt.estado ?? apt.status ?? "").toUpperCase();
  const status: AppointmentStatus =
    ["CONFIRMADA","CONFIRMADO","RESERVADO"].includes(raw) ? "confirmada" : "pendiente";

  // nombres (cubre varias formas de respuesta)
  const teacherName = pick(
    apt.docente, apt.docenteNombre, apt.docente_nombre, apt.teacher, apt.teacherName,
    apt?.docente?.nombre, apt?.docente?.name
  );
  const advisorName = pick(
    apt.asesor, apt.asesorNombre, apt.asesor_nombre, apt.advisor, apt.advisorName,
    apt?.asesor?.nombre, apt?.asesor?.usuario?.nombre
  );

  return {
    id: String(apt.id ?? crypto.randomUUID()),
    title: pick(apt.servicio, apt.titulo, apt.title) ?? "Asesoría",
    time: timeStr(start),
    dateLabel: start ? labelForDate(start) : "Próximo",
    teacherName,
    advisorName,
    location: pick(apt.ubicacion, apt.recurso, apt.location) ?? "Por definir",
    status,
  };
}
