export type ReservationStatus = "confirmada" | "pendiente" | "cancelada" | "completada";

export interface Reservation {
  id: string;
  dateISO: string;        // "2025-01-15T10:00:00Z"
  day: string;            // "15"
  month: string;          // "ENE"
  time: string;           // "10:00 AM"
  endTime?: string;       // "11:00 AM"
  duration: string;       // "60 min"
  serviceTitle: string;   // "Tutoria Individual - Matematicas"
  category: string;       // slug para filtros (ej. "academica")
  categoryLabel?: string;
  service: string;        // slug del servicio (ej. "tutoria")
  advisor: { initials: string; name: string; email: string; id?: string };
  status: ReservationStatus;
  location?: string;
  canRetryConfirm?: boolean;
  docente?: { nombre: string; email: string };
}


