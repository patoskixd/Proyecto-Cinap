import type { Teacher } from "@/domain/admin/teachers";
import type { TeachersRepo } from "@application/admin/teachers/ports/TeachersRepo";

export class UpdateTeacher {
  constructor(private repo: TeachersRepo) {}
  async exec(t: Teacher): Promise<void> {
    await this.repo.update(t);
  }
}
