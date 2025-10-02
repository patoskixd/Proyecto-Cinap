export type ReservationStatus = "confirmada" | "pendiente" | "cancelada";

export interface Reservation {
  id: string;
  dateISO: string;        // "2025-01-15T10:00:00Z" (opcional, para futuro)
  day: string;            // "15"
  month: string;          // "ENE"
  time: string;           // "10:00 AM"
  duration: string;       // "60 min"
  serviceTitle: string;   // "Tutoría Individual - Matemáticas"
  category: string;       // "academica" | "psicologica" | "vocacional" (ej.)
  service: string;        // "tutoria" | "orientacion" | "apoyo" (ej.)
  advisor: { initials: string; name: string; email: string; id?: string };
  status: ReservationStatus;
}
