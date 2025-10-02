import type { AdminCatalogRepo } from "../../ports/AdminCatalogRepo";
import type { AdminService } from "@domain/adminCatalog";

export default class CreateService {
  constructor(private repo: AdminCatalogRepo) {}
  async exec(categoryId: string, payload: { name: string; durationMinutes: number; active?: boolean }): Promise<AdminService> {
    return this.repo.createService(categoryId, payload);
  }
}
