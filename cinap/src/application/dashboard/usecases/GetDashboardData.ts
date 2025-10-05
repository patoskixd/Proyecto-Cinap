import type { Role } from "@/domain/auth";
import type { ReservationsRepo } from "@/application/teacher/asesorias/ports/ReservationsRepo";
import { reservationsToAppointments } from "../adapters/ReservationToAppointmentAdapter";
import type { DashboardData } from "../ports/DashboardRepo";

export class GetDashboardData {
  constructor(private readonly reservationsRepo: ReservationsRepo) {}

  async exec(role: Role, userId?: string): Promise<DashboardData> {
    // Obtener reservas próximas
    const { upcoming: upcomingReservations } = await this.reservationsRepo.list();
    
    // Convertir a appointments para el dashboard
    const upcoming = reservationsToAppointments(upcomingReservations);

    // Datos base para todos los roles
    const baseData: DashboardData = {
      upcoming,
      drafts: [],
      monthCount: upcoming.length,
      pendingCount: upcoming.filter(apt => apt.status === "pendiente").length,
      isCalendarConnected: true,
    };

    // Datos específicos por rol
    if (role === "admin") {
      return {
        ...baseData,
        adminMetrics: {
          advisorsTotal: 12,
          advisorsAvailable: 9,
          teachersTotal: 120,
          appointmentsThisMonth: 86,
          approvalsPending: 5,
        },
      };
    }

    if (role === "teacher") {
      return {
        ...baseData,
        drafts: [
          { 
            id: "d1", 
            icon: "📝", 
            title: "Borrador asesoría TIC", 
            status: "incompleto", 
            dateLabel: "Creado hoy" 
          },
          { 
            id: "d2", 
            icon: "🧪", 
            title: "Solicitud laboratorio", 
            status: "falta confirmar", 
            dateLabel: "Ayer" 
          },
        ],
      };
    }

    return baseData;
  }
}