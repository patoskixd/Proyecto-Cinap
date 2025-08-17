
export type AppointmentStatus = "confirmada" | "pendiente";
// Define las interfaces para Appointment y Draft usadas en la aplicación
export interface Appointment {
  id: string;
  time: string;        // "10:00 AM"
  dateLabel: string;   // "Hoy" | "Mañana" | "Viernes"
  title: string;       // "nombre de la asesoría"
  student: string;     // "Ana Rodriguez"
  status: AppointmentStatus;
}

export interface Draft {
  id: string;
  icon: string;        // emoji / ícono
  title: string;
  status: string;      // "Borrador - Sin confirmar"
  dateLabel: string;   // "Creado hace 2 horas"
}
