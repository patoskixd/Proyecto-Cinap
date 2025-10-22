import { SchedulingRepo } from "@/application/teacher/asesorias/agendar/ports/SchedulingRepo";
import { FindSlotsInput, FoundSlot } from "@/domain/teacher/scheduling";

export class GetSchedulingData {
  constructor(private repo: SchedulingRepo) {}
  async exec(input: FindSlotsInput): Promise<FoundSlot[]> {
    return this.repo.findSlots(input);
  }
}
