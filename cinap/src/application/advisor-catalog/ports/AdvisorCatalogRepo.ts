import type {
  AdvisorCatalog,
  JoinCategoryInput,
  LeaveCategoryInput,
} from "@domain/advisorCatalog";

export interface AdvisorCatalogRepo {
  list(): Promise<AdvisorCatalog>;
  joinCategory(input: JoinCategoryInput): Promise<void>;
  leaveCategory(input: LeaveCategoryInput): Promise<void>;
}
