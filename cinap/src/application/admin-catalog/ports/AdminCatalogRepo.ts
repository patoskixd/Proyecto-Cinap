import type { AdminCategory, AdminService } from "@domain/adminCatalog";

export interface AdminCatalogRepo {
  // Categorías
  listCategories(): Promise<AdminCategory[]>;
  createCategory(payload: { name: string; description: string }): Promise<AdminCategory>;
  updateCategory(id: string, patch: { name?: string; description?: string; active?: boolean }): Promise<AdminCategory>;
  deleteCategory(id: string): Promise<void>;
  reactivateCategory(id: string): Promise<AdminCategory>;

  // Servicios
  createService(categoryId: string, payload: { name: string; durationMinutes: number; active?: boolean }): Promise<AdminService>;
  updateService(id: string, patch: { name?: string; durationMinutes?: number; active?: boolean }): Promise<AdminService>;
  deleteService(id: string): Promise<void>;
  reactivateService(id: string): Promise<AdminService>;
}
