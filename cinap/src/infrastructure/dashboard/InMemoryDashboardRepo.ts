import type { DashboardRepo, DashboardData, DashboardInput } from "@application/dashboard/ports/DashboardRepo";
import type { Appointment, Draft } from "@domain/appointment";


type Raw = Appointment & {
  advisorId: string;
  teacherId: string;
  confirmed: boolean;
};


const ALL_APPOINTMENTS: Raw[] = [

  { id:"a1", time:"10:00 AM", dateLabel:"Hoy",     title:"Asesoría de Matemáticas",         student:"Ana Rodríguez",   status:"confirmada", advisorId:"adv-1", teacherId:"t-10", confirmed:true },
  { id:"a2", time:"2:30 PM",  dateLabel:"Mañana",  title:"Asesoría de Física",              student:"Carlos López",    status:"confirmada", advisorId:"adv-2", teacherId:"t-10", confirmed:true },

  // Otros docentes/asesores
  { id:"a3", time:"11:00 AM", dateLabel:"Viernes", title:"Apoyo Psicológico - Ansiedad",    student:"M. Fuentes",      status:"confirmada", advisorId:"adv-1", teacherId:"t-30", confirmed:true },
  { id:"a4", time:"09:00 AM", dateLabel:"Hoy",     title:"Tutoría Individual - Álgebra",     student:"José Pérez",      status:"pendiente",  advisorId:"adv-1", teacherId:"t-20", confirmed:false },
  { id:"a5", time:"10:00 AM", dateLabel:"Mañana",  title:"Química Orgánica",                student:"María F.",        status:"confirmada", advisorId:"adv-2", teacherId:"t-40", confirmed:true },
];

export class InMemoryDashboardRepo implements DashboardRepo {
  async getDashboard({ role, userId }: DashboardInput): Promise<DashboardData> {
    let filtered: Raw[] = ALL_APPOINTMENTS;

    if (role === "teacher") {
      filtered = userId
        ? ALL_APPOINTMENTS.filter(a => a.teacherId === userId)
        : ALL_APPOINTMENTS.filter(a => a.teacherId === "t-10");
    } else if (role === "advisor") {
      filtered = userId
        ? ALL_APPOINTMENTS.filter(a => a.advisorId === userId && a.confirmed)
        : ALL_APPOINTMENTS.filter(a => a.advisorId === "adv-1" && a.confirmed);
    } else {
      filtered = ALL_APPOINTMENTS;
    }

    const upcoming: Appointment[] = filtered.map(({ advisorId, teacherId, confirmed, ...rest }) => rest);


    if (role === "teacher") {
      const drafts: Draft[] = [
        { id: "td1", icon: "📝", title: "Asesoría de Estadística", status: "Borrador - Sin confirmar", dateLabel: "Creado hace 2 horas" },
      ];
      return {
        upcoming,
        drafts,
        monthCount: 7,
        pendingCount: 2,
        isCalendarConnected: true,
      };
    }

    if (role === "advisor") {
      const drafts: Draft[] = [
        { id: "ad1", icon: "⏳", title: "Confirmar reagendamiento", status: "Pendiente de confirmación", dateLabel: "Enviado ayer" },
      ];
      return {
        upcoming,
        drafts,
        monthCount: 18,   // “cantidad este mes”
        pendingCount: 4,  // “por confirmar”
        isCalendarConnected: true,
      };
    }

    // admin
    const adminMetrics = {
      advisorsTotal: 26,
      advisorsAvailable: 19,
      teachersTotal: 420,
      appointmentsThisMonth: 124,
      approvalsPending: 9,
    };

    return {
      upcoming,
      drafts: [],
      monthCount: adminMetrics.appointmentsThisMonth,
      pendingCount: adminMetrics.approvalsPending,
      isCalendarConnected: true,
      adminMetrics,
    };
  }
}
