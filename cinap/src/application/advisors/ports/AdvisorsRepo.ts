import type { Advisor, AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";

export type UpdateAdvisorDTO = {
  basic?: AdvisorBasicInfo;
  categories?: CategoryId[];
  services?: AdvisorServiceRef[];

};

export interface AdvisorsRepo {
  list(): Promise<Advisor[]>;
  add(input: { basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] }): Promise<Advisor>;
  update(id: string, changes: UpdateAdvisorDTO): Promise<Advisor>;
  remove(id: string): Promise<void>;
}
