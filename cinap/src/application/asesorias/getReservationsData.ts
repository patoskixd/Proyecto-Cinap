// src/application/asesorias/getReservationsData.ts
import { Reservation } from "@/domain/reservation";

export async function getReservationsData(): Promise<{
  upcoming: Reservation[];
  past: Reservation[];
}> {
  // Datos simulados de reservas próximas y pasadas

  const upcoming: Reservation[] = [
    {
      id: "r1",
      dateISO: "2025-01-15T10:00:00Z",
      day: "15",
      month: "ENE",
      time: "10:00 AM",
      duration: "60 min",
      serviceTitle: "Tutoría Individual - Matemáticas",
      category: "academica",
      service: "tutoria",
      advisor: { initials: "MG", name: "María González", email: "maria.gonzalez@cinap.edu" },
      status: "confirmada",
    },
    {
      id: "r2",
      dateISO: "2025-01-18T14:30:00Z",
      day: "18",
      month: "ENE",
      time: "2:30 PM",
      duration: "45 min",
      serviceTitle: "Orientación Vocacional",
      category: "vocacional",
      service: "orientacion",
      advisor: { initials: "CR", name: "Carlos Rodríguez", email: "carlos.rodriguez@cinap.edu" },
      status: "pendiente",
    },
    {
      id: "r3",
      dateISO: "2025-01-22T11:15:00Z",
      day: "22",
      month: "ENE",
      time: "11:15 AM",
      duration: "90 min",
      serviceTitle: "Apoyo Psicológico - Ansiedad",
      category: "psicologica",
      service: "apoyo",
      advisor: { initials: "AM", name: "Ana Martínez", email: "ana.martinez@cinap.edu" },
      status: "confirmada",
    },
  ];

  const past: Reservation[] = []; // Por ahora no hay reservas pasadas

  return { upcoming, past };
}
