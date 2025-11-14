import type { AdvisorCatalog } from "@/domain/advisor/catalog";

export interface AdvisorCatalogQueryRepo {
  list(): Promise<AdvisorCatalog>;
}
