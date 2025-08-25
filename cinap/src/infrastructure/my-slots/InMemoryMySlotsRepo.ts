"use client";

import type { MySlot } from "@domain/mySlots";
import type { MySlotsRepo } from "@application/my-slots/ports/MySlotsRepo";

export class InMemoryMySlotsRepo implements MySlotsRepo {
  private slots: MySlot[];

  constructor(seed?: MySlot[]) {
    this.slots = seed ? [...seed] : [
      {
        id: 1,
        category: "Investigación",
        service: "Revisión de Documentos",
        date: "2024-01-16",
        time: "14:00",
        duration: 90,
        location: "Edificio B",
        room: "Sala 105",
        status: "ocupado",
        student: { name: "María González", email: "maria.gonzalez@email.com" },
        notes: "Traer avances impresos",
      },
      {
        id: 2,
        category: "Tesis y Proyectos",
        service: "Asesoría Grupal",
        date: "2024-01-17",
        time: "10:00",
        duration: 120,
        location: "Edificio C",
        room: "Aula Magna",
        status: "disponible",
        student: null,
      },
      {
        id: 3,
        category: "Asesoría Académica",
        service: "Asesoría Individual",
        date: "2024-01-18",
        time: "16:00",
        duration: 60,
        location: "Edificio A",
        room: "Sala 301",
        status: "cancelado",
        student: null,
      },
    ];
  }

  async getMySlots(): Promise<MySlot[]> {
    await new Promise(r => setTimeout(r, 100));
    return [...this.slots].sort((a, b) =>
      a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );
  }

  async updateMySlot(id: number, patch: Partial<MySlot>): Promise<MySlot> {
    const idx = this.slots.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Slot no encontrado");
    this.slots[idx] = { ...this.slots[idx], ...patch };
    return this.slots[idx];
  }

  async deleteMySlot(id: number): Promise<void> {
    const found = this.slots.find(s => s.id === id);
    if (found?.status === "ocupado") throw new Error("No se puede eliminar un cupo ocupado");
    this.slots = this.slots.filter(s => s.id !== id);
  }

  async reactivateMySlot(id: number): Promise<MySlot> {
    const idx = this.slots.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Slot no encontrado");
    this.slots[idx].status = "disponible";
    return this.slots[idx];
  }
}
