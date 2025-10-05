import type { AdminCatalogRepo } from "@application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory } from "@/domain/admin/catalog";

export default class ListCategories {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(): Promise<AdminCategory[]> { return this.repo.listCategories(); }
}
