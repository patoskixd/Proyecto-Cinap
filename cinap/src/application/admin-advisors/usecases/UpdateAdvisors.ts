import type { Advisor, AdvisorId, UpdateAdvisorRequest } from "@domain/adminAdvisors";
import type { AdminAdvisorRepo } from "../ports/AdminAdvisorRepo";

export class UpdateAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor> {
    return this.repo.update(id, changes);
  }
}