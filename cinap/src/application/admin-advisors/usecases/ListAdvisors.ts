import type { Advisor } from "@domain/adminAdvisors";
import type { AdminAdvisorRepo } from "../ports/AdminAdvisorRepo";

export class ListAdvisors {
  constructor(private repo: AdminAdvisorRepo) {}
  
  async exec(): Promise<Advisor[]> {
    return this.repo.list();
  }
}