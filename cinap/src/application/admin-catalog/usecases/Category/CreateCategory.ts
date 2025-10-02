import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminCategory } from "@domain/adminCatalog";

export default class CreateCategory {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(payload: { name: string; description: string }): Promise<AdminCategory> {
    return this.repo.createCategory(payload);
  }
}
