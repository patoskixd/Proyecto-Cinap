import type { AdvisorCatalog } from "@domain/advisorCatalog";
import type { AdvisorCatalogRepo } from "../ports/AdvisorCatalogRepo";

export class GetAdvisorCatalog {
  constructor(private readonly repo: AdvisorCatalogRepo) {}

  exec(): Promise<AdvisorCatalog> {
    return this.repo.list();
  }
}
