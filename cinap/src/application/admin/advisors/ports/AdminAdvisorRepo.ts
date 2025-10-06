import type { 
  Advisor, 
  AdvisorId, 
  RegisterAdvisorRequest, 
  UpdateAdvisorRequest 
} from "@/domain/admin/advisors";

export interface AdminAdvisorRepo {
  list(): Promise<Advisor[]>;
  add(request: RegisterAdvisorRequest): Promise<Advisor>;
  update(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor>;
  remove(id: AdvisorId): Promise<Advisor>;
}
