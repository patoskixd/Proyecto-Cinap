import type { Advisor, RegisterAdvisorRequest } from "@domain/adminAdvisors";
import type { AdminAdvisorRepo } from "../ports/AdminAdvisorRepo";

export class RegisterAdvisor {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(request: RegisterAdvisorRequest): Promise<Advisor> {
    return this.repo.add(request);
  }
}
