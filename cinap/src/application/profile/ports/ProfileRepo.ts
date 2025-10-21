export type RoleName = "Profesor" | "Asesor" | "Admin";

export type ProfileSummary = {
  user: { id: string; name: string; email: string; role: RoleName; verified?: boolean };
  stats: { completed: number; canceled: number; total: number };
};

export interface ProfileRepo {
  getMyProfile(): Promise<ProfileSummary>;
}
