import type { Advisor, RegisterAdvisorRequest } from "@/domain/admin/advisors";
import type { AdminAdvisorRepo } from "@application/admin/advisors/ports/AdminAdvisorRepo";

export class RegisterAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(request: RegisterAdvisorRequest): Promise<Advisor> {
    return this.repo.add(request);
  }
}
