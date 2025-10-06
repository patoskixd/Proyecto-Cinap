import type { Advisor } from "@/domain/admin/advisors";
import type { AdminAdvisorRepo } from "@application/admin/advisors/ports/AdminAdvisorRepo";

export class ListAdvisors {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(): Promise<Advisor[]> {
    return this.repo.list();
  }
}