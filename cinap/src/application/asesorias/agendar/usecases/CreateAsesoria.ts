import { SchedulingRepo } from "@application/asesorias/agendar/ports/SchedulingRepo";
import { ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/scheduling";

export class CreateAsesoria {
  constructor(private repo: SchedulingRepo) {}
  async exec(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    return this.repo.reserve(input);
  }
}
