// Domain ───────────────

export type AdvisorId = string;
export type CategoryId = string;
export type ServiceId = string;

export type AdvisorBasicInfo = {
  name: string;
  email: string;
};

export type AdvisorServiceRef = {
  id: ServiceId;
  categoryId: CategoryId;
};

export type Advisor = {
  id: AdvisorId;
  basic: AdvisorBasicInfo;
  categories: CategoryId[];
  services: AdvisorServiceRef[];
  createdAt: string; // ISO
};
