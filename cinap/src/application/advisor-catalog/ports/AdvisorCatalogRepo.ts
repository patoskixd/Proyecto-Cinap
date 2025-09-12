import type { AdvisorCatalog } from "@domain/advisorCatalog";

export interface AdvisorCatalogQueryRepo {
  list(): Promise<AdvisorCatalog>;
}
