import Link from "next/link";
import type { Role } from "@/domain/auth";
import type { Appointment } from "@/domain/appointment";

// Permitimos campos opcionales para mantener compatibilidad
type UIAppointment = Appointment & {
  teacherName?: string | null;
  advisorName?: string | null;
  // algunos backends antiguos podían mandar `student`
  student?: string | null;
};

type Props = {
  appointments: UIAppointment[];
  role: Role;
  total?: number;
};

const statusChip = (s: UIAppointment["status"]) =>
  s === "confirmada"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

const statusText = (s: UIAppointment["status"]) =>
  s === "confirmada" ? "Confirmada" : "Pendiente";

// Línea que muestra nombres según el rol
function whoLine(a: UIAppointment, role: Role) {
  const teacher = a.teacherName ?? "-";
  // si tu adapter viejo puso el asesor en `student`, lo usamos como fallback
  const advisor = a.advisorName ?? a.student ?? "-";

  if (role === "teacher") return `Asesor: ${advisor}`;
  if (role === "advisor") return `Docente: ${teacher}`;
  return `Docente: ${teacher} · Asesor: ${advisor}`;
}

export default function UpcomingAppointments({ appointments, role, total }: Props) {
  const items = (appointments ?? []).slice(0, 4);
  const count = typeof total === "number" ? total : (appointments?.length ?? 0);
  const allUrl =
    role === "advisor"
      ? "/asesor/asesorias"
      : role === "admin"
      ? "/admin/asesorias"
      : "/profesor/asesorias";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-blue-900">Próximas Asesorías</h2>
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">

          {count}
        </span>
      </div>

      {/* Empty state (sin iconos) */}
      {items.length === 0 ? (
        <div className="px-6 py-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">No hay asesorías próximas</h3>
          <p className="text-sm text-blue-700">Las próximas asesorías programadas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-3 px-6 py-5">
          {items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Hora y día (solo texto) */}
              <div className="min-w-[84px] text-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-2 text-white shadow-sm">
                <div className="text-lg font-bold">{a.time || "--:--"}</div>
                <div className="text-xs font-medium opacity-90">{a.dateLabel}</div>
              </div>

              {/* Detalles */}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900">{a.title}</h4>
                <p className="text-sm text-blue-700">{whoLine(a, role)}</p>
                {a.location && (
                  <p className="mt-1 text-xs text-blue-600 font-medium">{a.location}</p>
                )}
              </div>

              {/* Estado (chip solo texto) */}
              <div
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${statusChip(
                  a.status
                )}`}
              >
                {statusText(a.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ver todas */}
      <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-white px-6 py-3">
        <Link
          href={allUrl}
          className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Ver todas las asesorías →
        </Link>
      </div>
    </div>
  );
}
