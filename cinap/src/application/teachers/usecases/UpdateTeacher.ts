import type { Teacher } from "@domain/teachers";
import type { TeachersRepo } from "../ports/TeachersRepo";

export class UpdateTeacher {
  constructor(private repo: TeachersRepo) {}
  async exec(t: Teacher): Promise<void> {
    await this.repo.update(t);
  }
}
