import type { TeacherConfirmationsRepo } from "../ports/ConfirmationsRepo";
import type { PendingTeacherConfirmation } from "@/domain/teacher/confirmations";

export class GetTeacherPendingConfirmations {
  constructor(private readonly repo: TeacherConfirmationsRepo) {}
  async exec(): Promise<PendingTeacherConfirmation[]> {
    return this.repo.getPending();
  }
}
