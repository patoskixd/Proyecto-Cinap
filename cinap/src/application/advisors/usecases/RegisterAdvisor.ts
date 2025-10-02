import type { AdvisorsRepo } from "../ports/AdvisorsRepo";
import type { AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";

type Input = { basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] };

export class RegisterAdvisor {
  constructor(private repo: AdvisorsRepo) {}

  async exec(input: Input) {
    const anyRepo = this.repo as any;
    if (typeof anyRepo.add === "function") {
      return anyRepo.add(input);
    }
    if (typeof anyRepo.save === "function") {
      return anyRepo.save(input);
    }
    throw new Error("AdvisorsRepo must implement add(...) or save(...).");
  }
}
