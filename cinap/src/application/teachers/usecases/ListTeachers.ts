import type { Teacher } from "@domain/teachers";
import type { TeachersRepo } from "../ports/TeachersRepo";

export class ListTeachers {
  constructor(private repo: TeachersRepo) {}
  async exec(): Promise<Teacher[]> {
    return this.repo.list();
  }
}
