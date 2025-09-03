import type { JoinCategoryInput } from "@domain/advisorCatalog";
import type { AdvisorCatalogRepo } from "../ports/AdvisorCatalogRepo";

export class JoinAdvisorCategory {
  constructor(private readonly repo: AdvisorCatalogRepo) {}

  async exec(input: JoinCategoryInput): Promise<void> {
    return this.repo.joinCategory(input);
  }
}
