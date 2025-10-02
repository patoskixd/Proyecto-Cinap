import type { AdminCatalogRepo } from "../ports/AdminCatalogRepo";
import type { AdminCategory } from "@domain/adminCatalog";

export default class ListCategories {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(): Promise<AdminCategory[]> { return this.repo.listCategories(); }
}
