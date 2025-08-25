import type { ConfirmationsRepo } from "@application/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@domain/confirmations";

export class InMemoryConfirmationsRepo implements ConfirmationsRepo {
  async getPending(): Promise<PendingConfirmation[]> {
    // mock basado en tu HTML
    return [
      {
        id: 1,
        category: "matematicas",
        categoryLabel: "Matemáticas",
        serviceTitle: "Cálculo Diferencial - Sesión Individual",
        teacher: "Dr. Carlos Mendoza",
        teacherEmail: "carlos.mendoza@universidad.edu",
        dateISO: "2025-09-1",
        time: "10:00",
        location: "Edificio A, Piso 2",
        room: "Sala 201-A",
        createdAtISO: new Date(Date.now() - 2 * 3600_000).toISOString(), // hace 2h
        status: "pending",
      },
      {
        id: 2,
        category: "fisica",
        categoryLabel: "Física",
        serviceTitle: "Mecánica Clásica - Tutoría Grupal",
        teacher: "Dra. Ana García",
        teacherEmail: "ana.garcia@universidad.edu",
        dateISO: "2025-08-26",
        time: "14:00",
        location: "Edificio B, Piso 1",
        room: "Laboratorio 105",
        createdAtISO: new Date(Date.now() - 4 * 3600_000).toISOString(), // hace 4h
        status: "pending",
      },
      {
        id: 3,
        category: "programacion",
        categoryLabel: "Programación",
        serviceTitle: "Algoritmos y Estructuras de Datos",
        teacher: "Ing. Roberto Silva",
        teacherEmail: "roberto.silva@universidad.edu",
        dateISO: "2025-08-29",
        time: "09:00",
        location: "Edificio C, Piso 3",
        room: "Lab. Computación 301",
        createdAtISO: new Date(Date.now() - 24 * 3600_000).toISOString(), // hace 1 día
        status: "pending",
      },
    ];
  }
}
