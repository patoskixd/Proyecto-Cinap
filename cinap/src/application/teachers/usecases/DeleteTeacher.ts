import type { TeacherId } from "@domain/teachers";
import type { TeachersRepo } from "../ports/TeachersRepo";

export class DeleteTeacher {
  constructor(private repo: TeachersRepo) {}
  async exec(id: TeacherId): Promise<void> {
    await this.repo.delete(id);
  }
}
