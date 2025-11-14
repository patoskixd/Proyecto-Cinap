import { PendingTeacherConfirmation } from "@/domain/teacher/confirmations";

export interface TeacherConfirmationsRepo {
  getPending(): Promise<PendingTeacherConfirmation[]>;
}
