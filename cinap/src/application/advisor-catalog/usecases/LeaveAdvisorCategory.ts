import type { LeaveCategoryInput } from "@domain/advisorCatalog";
import type { AdvisorCatalogRepo } from "../ports/AdvisorCatalogRepo";

export class LeaveAdvisorCategory {
  constructor(private readonly repo: AdvisorCatalogRepo) {}

  async exec(input: LeaveCategoryInput): Promise<void> {
    return this.repo.leaveCategory(input);
  }
}
