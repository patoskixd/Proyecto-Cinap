import type { AdvisorId } from "@/domain/admin/advisors";
import type { AdminAdvisorRepo } from "@application/admin/advisors/ports/AdminAdvisorRepo";

export class DeleteAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(id: AdvisorId): Promise<void> {
    await this.repo.remove(id);
  }
}