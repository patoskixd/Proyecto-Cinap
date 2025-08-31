import type { AdvisorsRepo } from "../ports/AdvisorsRepo";
import type { AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";

export type UpdateAdvisorInput = {
  id: string;
  basic?: AdvisorBasicInfo;
  categories?: CategoryId[];
  services?: AdvisorServiceRef[];
  active?: boolean;
};

export class UpdateAdvisor {
  constructor(private repo: AdvisorsRepo) {}
  async exec(input: UpdateAdvisorInput) {
    return this.repo.update(input.id, input);
  }
}
