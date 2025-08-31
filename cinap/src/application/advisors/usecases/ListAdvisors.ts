import type { AdvisorsRepo } from "../ports/AdvisorsRepo";

export class ListAdvisors {
  constructor(private repo: AdvisorsRepo) {}
  async exec() {
    return this.repo.list();
  }
}
