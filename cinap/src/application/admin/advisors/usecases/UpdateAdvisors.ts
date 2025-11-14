import type { Advisor, AdvisorId, UpdateAdvisorRequest } from "@/domain/admin/advisors";
import type { AdminAdvisorRepo } from "@application/admin/advisors/ports/AdminAdvisorRepo";

export class UpdateAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor> {
    return this.repo.update(id, changes);
  }
}