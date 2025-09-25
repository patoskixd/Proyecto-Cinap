export type AdminService = {
  id: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  active: boolean;
};

export type AdminCategory = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  services: AdminService[];
};
