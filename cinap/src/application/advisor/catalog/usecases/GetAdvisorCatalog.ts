// application/advisor-catalog/usecases/GetAdvisorCatalog.ts
import type { AdvisorCatalog } from "@/domain/advisor/catalog";
import type { AdvisorCatalogQueryRepo } from "../ports/AdvisorCatalogRepo";

export class GetAdvisorCatalog {
  constructor(private readonly repo: AdvisorCatalogQueryRepo) {}
  exec(): Promise<AdvisorCatalog> {
    return this.repo.list();
  }
}
