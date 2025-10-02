import type { Reservation } from "@/domain/reservation";
import type { Appointment, AppointmentStatus } from "@/domain/appointment";

/**
 * Convierte una Reservation a Appointment para usar en el dashboard
 */
export function reservationToAppointment(reservation: Reservation): Appointment {
  // Crear dateLabel basado en la fecha ISO
  const reservationDate = new Date(reservation.dateISO);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let dateLabel = "Próximo";
  
  if (reservationDate.toDateString() === today.toDateString()) {
    dateLabel = "Hoy";
  } else if (reservationDate.toDateString() === tomorrow.toDateString()) {
    dateLabel = "Mañana";
  } else {
    // Formatear como "Lun 15"
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dayName = dayNames[reservationDate.getDay()];
    const dayNumber = reservationDate.getDate();
    dateLabel = `${dayName} ${dayNumber}`;
  }

  // Mapear status de Reservation a AppointmentStatus
  const appointmentStatus: AppointmentStatus = 
    reservation.status === "confirmada" ? "confirmada" : "pendiente";

  return {
    id: reservation.id,
    time: reservation.time,
    dateLabel,
    title: reservation.serviceTitle,
    student: reservation.advisor.name, // En el dashboard, mostramos el asesor como "estudiante"
    status: appointmentStatus,
    location: "Por definir", // Las reservas no tienen ubicación específica aún
  };
}

/**
 * Convierte un array de Reservations a Appointments
 */
export function reservationsToAppointments(reservations: Reservation[]): Appointment[] {
  return reservations.map(reservationToAppointment);
}