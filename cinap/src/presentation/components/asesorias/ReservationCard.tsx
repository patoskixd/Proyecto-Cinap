import type { Role } from "@/domain/auth";
import type { Reservation } from "@/domain/reservation";

interface ReservationCardProps {
  reservation: Reservation;
  role: Role | null;
  canCancel: boolean;
  canConfirm: boolean;
  onCancel?: () => void | Promise<void>;
  onConfirm?: () => void | Promise<void>;
  actionState: { id: string | null; type: "cancel" | "confirm" | null };
}

const STATUS_STYLES: Record<Reservation["status"], string> = {
  confirmada: "bg-emerald-50 border-emerald-200 text-emerald-700",
  completada: "bg-emerald-50 border-emerald-200 text-emerald-700",
  pendiente: "bg-amber-50 border-amber-200 text-amber-700",
  cancelada: "bg-rose-50 border-rose-200 text-rose-700",
};

const STATUS_LABEL: Record<Reservation["status"], string> = {
  confirmada: "Confirmada",
  pendiente: "Pendiente",
    cancelada: "Cancelada",
  completada: "Completada",
};

export default function ReservationCard({
  reservation,
  role,
  canCancel,
  canConfirm,
  onCancel,
  onConfirm,
  actionState,
}: ReservationCardProps) {
  const isCancelling = actionState.id === reservation.id && actionState.type === "cancel";
  const isConfirming = actionState.id === reservation.id && actionState.type === "confirm";

  const showCancelButton =
    canCancel && (reservation.status === "pendiente" || reservation.status === "confirmada");
  const isPending = reservation.status === "pendiente";
  const isReconfirmableCancellation = reservation.status === "cancelada" && reservation.canRetryConfirm;
  const showConfirmButton = canConfirm && (isPending || isReconfirmableCancellation);

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-yellow-50/10 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-2 text-white shadow-lg">
            <span className="text-xl font-extrabold leading-none">{reservation.day}</span>
            <span className="text-[10px] font-bold uppercase opacity-90 tracking-widest">{reservation.month}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-900">
              {reservation.time}
              {reservation.endTime ? ` - ${reservation.endTime}` : ""}
            </span>
            <span className="text-xs text-blue-700">Duracion: {reservation.duration}</span>
          </div>
        </div>

        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[reservation.status]}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {STATUS_LABEL[reservation.status]}
        </span>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">{reservation.serviceTitle}</h3>
          <p className="text-sm text-blue-700">Categoria: {reservation.categoryLabel ?? reservation.category}</p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-yellow-500 text-sm font-bold text-white shadow-lg ring-2 ring-white">
              {reservation.advisor.initials}
            </div>
            <div>
              <p className="font-semibold text-blue-900">{reservation.advisor.name}</p>
              <p className="text-xs text-blue-600">{reservation.advisor.email}</p>
            </div>
          </div>

          {role !== "teacher" && reservation.docente ? (
            <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.866-3.582 7-8 7 0 3 5.333 4 8 4s8-1 8-4c-4.418 0-8-3.134-8-7z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">Docente: {reservation.docente.nombre}</p>
                <p className="text-xs text-blue-600">{reservation.docente.email}</p>
              </div>
            </div>
          ) : null}

          {reservation.location ? (
            <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">{reservation.location}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {showCancelButton ? (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCancelling ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              Cancelar
            </button>
          ) : null}

          {showConfirmButton ? (
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConfirming ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Confirmar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

