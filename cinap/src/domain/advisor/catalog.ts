export type CategoryId = string;
export type ServiceId  = string;

export type Category = {
  id: CategoryId;
  name: string;
  description?: string;
  status?: "active" | "inactive";
};

export type Service = {
  id: ServiceId;
  categoryId: CategoryId;
  name: string;
  description?: string;
  duration?: number;     
  status?: "active" | "inactive";
};


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

