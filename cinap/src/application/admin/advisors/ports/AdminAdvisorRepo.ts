import type {
  Advisor,
  AdvisorId,
  RegisterAdvisorRequest,
  UpdateAdvisorRequest,
  AdvisorsPage,
} from "@/domain/admin/advisors";

export interface AdminAdvisorRepo {
  list(params?: { page?: number; limit?: number; query?: string; categoryId?: string; serviceId?: string }): Promise<AdvisorsPage>;
  add(request: RegisterAdvisorRequest): Promise<Advisor>;
  update(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor>;
  remove(id: AdvisorId): Promise<Advisor>;
}
