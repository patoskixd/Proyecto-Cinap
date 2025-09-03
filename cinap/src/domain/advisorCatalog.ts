import type { Category, Service, CategoryId } from "@domain/scheduling";

export type AdvisorCategory = {
  category: Category;       
  services: Service[];       
  status: "active" | "available";
};

export type AdvisorCatalog = {
  active: AdvisorCategory[];
  available: AdvisorCategory[];
  stats: {
    activeCategories: number;
    activeServices: number;
  };
};

export type JoinCategoryInput = { categoryId: CategoryId };
export type LeaveCategoryInput = { categoryId: CategoryId };
