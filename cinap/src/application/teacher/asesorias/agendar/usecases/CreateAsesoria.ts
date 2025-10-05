import { SchedulingRepo } from "@/application/teacher/asesorias/agendar/ports/SchedulingRepo";
import { ReserveAsesoriaInput, CreateAsesoriaOut } from "@/domain/teacher/scheduling";

export class CreateAsesoria {
  constructor(private repo: SchedulingRepo) {}
  async exec(input: ReserveAsesoriaInput): Promise<CreateAsesoriaOut> {
    return this.repo.reserve(input);
  }
}
