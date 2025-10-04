import type { AdvisorId } from "@domain/adminAdvisors";
import type { AdminAdvisorRepo } from "../ports/AdminAdvisorRepo";

export class DeleteAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(id: AdvisorId): Promise<void> {
    await this.repo.remove(id);
  }
}