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

export type AdvisorServiceInfo = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

export type Advisor = {
  id: AdvisorId;
  basic: AdvisorBasicInfo;
  categories: CategoryId[];
  services: AdvisorServiceInfo[];
  active: boolean;
  createdAt: string; // ISO
};

export type AdvisorsPage = {
  items: Advisor[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
};

export type RegisterAdvisorRequest = {
  basic: AdvisorBasicInfo;
  categories: CategoryId[];
  services: ServiceId[];
};

export type UpdateAdvisorRequest = {
  basic?: Partial<AdvisorBasicInfo>;
  categories?: CategoryId[];
  services?: ServiceId[];
  active?: boolean;
};

export type AdvisorInfo = {
  id: number;
  name: string;
  email: string;
  services: {
    id: number;
    name: string;
    category_name: string;
  }[];
  created_at: string;
};
