export type AppointmentStatus = "confirmada" | "pendiente";

export interface Appointment {
  id: string;
  time: string;        // "09:30"
  dateLabel: string;   // "Hoy" | "Mañana" | "Lun 15"
  title: string;       // "nombre del servicio"
  advisorName?: string; // nombre del asesor
  teacherName?: string; // nombre del docente
  status: AppointmentStatus;
  location?: string;   // "Aula 205" | "Virtual"
}
