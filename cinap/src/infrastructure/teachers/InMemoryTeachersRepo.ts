import type { TeachersRepo } from "@application/teachers/ports/TeachersRepo";
import type { Teacher, TeacherId } from "@domain/teachers";

export class InMemoryTeachersRepo implements TeachersRepo {
  private data: Teacher[] = [
    { id: "t1", name: "Dr. María González", email: "maria.gonzalez@universidad.edu" },
    { id: "t2", name: "Prof. Juan Rodríguez", email: "juan.rodriguez@universidad.edu" },
    { id: "t3", name: "Dra. Ana López", email: "ana.lopez@universidad.edu" },
    { id: "t4", name: "Prof. Carlos Martínez", email: "carlos.martinez@universidad.edu" },
    { id: "t5", name: "Dra. Laura Silva", email: "laura.silva@universidad.edu" },
  ];

  async list(): Promise<Teacher[]> {
    await delay(120);

    return this.data.map((t) => ({ ...t }));
  }

  async update(teacher: Teacher): Promise<void> {
    await delay(120);
    const i = this.data.findIndex((t) => t.id === teacher.id);
    if (i >= 0) this.data[i] = { ...teacher };
  }

  async delete(id: TeacherId): Promise<void> {
    await delay(120);
    this.data = this.data.filter((t) => t.id !== id);
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
