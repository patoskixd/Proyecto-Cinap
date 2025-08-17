
import { Appointment, Draft } from "@/domain/appointment";

//Actualmente los datos son estáticos, pero en el futuro se obtendrán de una  base de datos.
export async function getDashboardData(): Promise<{
  upcoming: Appointment[];
  drafts: Draft[];
  monthCount: number;
  pendingCount: number;
  isCalendarConnected: boolean;
}> {
  const upcoming: Appointment[] = [
    { id: "a1", time: "10:00 AM", dateLabel: "Hoy",     title: "Asesoría de Matematicas", student: "Ana Rodriguez",    status: "confirmada" },
    { id: "a2", time: "2:30 PM",  dateLabel: "Mañana",  title: "Asesoría de Fisica",      student: "Carlos Lopez",     status: "confirmada" },
    { id: "a3", time: "11:00 AM", dateLabel: "Viernes", title: "Asesoría de Quimica",     student: "María Fernandez",  status: "confirmada" },
  ];

  const drafts: Draft[] = [
    { id: "d1", icon: "📝", title: "Asesoría de Estadística", status: "Borrador - Sin confirmar", dateLabel: "Creado hace 2 horas" },
    { id: "d2", icon: "⏳", title: "Asesoría de Biología",     status: "Pendiente de confirmación", dateLabel: "Enviado ayer" },
    { id: "d3", icon: "📝", title: "Asesoría de Historia",     status: "Borrador - Incompleto",     dateLabel: "Creado hace 1 día" },
  ];

  return {
    upcoming,
    drafts,
    monthCount: 12,
    pendingCount: 3,
    isCalendarConnected: true,
  };
}
