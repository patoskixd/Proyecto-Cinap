import type { Teacher, TeacherId } from "@domain/teachers";

export interface TeachersRepo {
  list(): Promise<Teacher[]>;
  update(teacher: Teacher): Promise<void>;
  delete(id: TeacherId): Promise<void>;
}
