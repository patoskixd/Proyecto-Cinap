import type { TeacherPage } from "@/domain/admin/teachers";
import type { TeachersRepo } from "@application/admin/teachers/ports/TeachersRepo";

export class ListTeachers {
  constructor(private repo: TeachersRepo) {}
  async exec(params?: { page?: number; limit?: number; query?: string }): Promise<TeacherPage> {
    return this.repo.list(params);
  }
}
