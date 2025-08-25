import type { AdvisorsRepo } from "../ports/AdvisorsRepo";

export class DeleteAdvisor {
  constructor(private repo: AdvisorsRepo) {}
  async exec(id: string) {
    await this.repo.remove(id);
  }
}
