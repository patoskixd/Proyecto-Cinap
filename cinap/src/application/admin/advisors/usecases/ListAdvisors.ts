import type { AdvisorsPage } from "@/domain/admin/advisors";
import type { AdminAdvisorRepo } from "@application/admin/advisors/ports/AdminAdvisorRepo";

export class ListAdvisors {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(params?: { page?: number; limit?: number; query?: string; categoryId?: string; serviceId?: string }): Promise<AdvisorsPage> {
    return this.repo.list(params);
  }
}
