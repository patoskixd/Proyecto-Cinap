import { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut, CheckConflictsInput, CheckConflictsOutput } from "@/domain/teacher/scheduling";

export interface SchedulingRepo {
  findSlots(input: FindSlotsInput): Promise<FoundSlot[]>;
  reserve(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut>;
  checkConflicts(input: CheckConflictsInput): Promise<CheckConflictsOutput>;
}
