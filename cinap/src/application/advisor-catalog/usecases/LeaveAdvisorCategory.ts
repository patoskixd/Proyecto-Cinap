import type { LeaveCategoryInput } from "@domain/advisorCatalog";
import type { AdvisorCatalogRepo } from "../ports/AdvisorCatalogRepo";

export class LeaveAdvisorCategory {
  constructor(private readonly repo: AdvisorCatalogRepo) {}

  async exec(input: LeaveCategoryInput): Promise<void> {
    // aquí podrías validar (no dejar si tiene asesorías futuras, etc.)
    return this.repo.leaveCategory(input);
  }
}
