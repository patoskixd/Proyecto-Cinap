import { FindSlotsInput, FoundSlot, ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/scheduling";

export interface SchedulingRepo {
  findSlots(input: FindSlotsInput): Promise<FoundSlot[]>;
  reserve(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut>;
}
