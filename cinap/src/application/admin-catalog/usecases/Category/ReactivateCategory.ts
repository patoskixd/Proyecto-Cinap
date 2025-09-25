import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminCategory } from "@domain/adminCatalog";

export default class ReactivateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string): Promise<AdminCategory> { return this.repo.reactivateCategory(id); }
}
