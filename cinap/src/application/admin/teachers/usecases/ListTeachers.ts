import type { Teacher } from "@/domain/admin/teachers";
import type { TeachersRepo } from "@application/admin/teachers/ports/TeachersRepo";

export class ListTeachers {
  constructor(private repo: TeachersRepo) {}
  async exec(): Promise<Teacher[]> {
    return this.repo.list();
  }
}
