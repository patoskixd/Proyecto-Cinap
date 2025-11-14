import type { TeacherId } from "@/domain/admin/teachers";
import type { TeachersRepo } from "@application/admin/teachers/ports/TeachersRepo";

export class DeleteTeacher {
  constructor(private repo: TeachersRepo) {}
  async exec(id: TeacherId): Promise<void> {
    await this.repo.delete(id);
  }
}
