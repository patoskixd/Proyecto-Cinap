import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminCategory } from "@domain/adminCatalog";

export default class UpdateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(id: string, patch: { name?: string; description?: string; active?: boolean }): Promise<AdminCategory> {
    return this.repo.updateCategory(id, patch);
  }
}