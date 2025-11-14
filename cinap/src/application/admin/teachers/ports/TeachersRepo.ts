import type { Teacher, TeacherId, TeacherPage } from "@/domain/admin/teachers";

export interface TeachersRepo {
  list(params?: { page?: number; limit?: number; query?: string }): Promise<TeacherPage>;
  update(teacher: Teacher): Promise<void>;
  delete(id: TeacherId): Promise<void>;
}
