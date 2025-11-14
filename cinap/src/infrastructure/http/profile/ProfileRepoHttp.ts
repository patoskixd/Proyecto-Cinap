import { httpGetCached } from "@/infrastructure/http/client";
import type { ProfileRepo, ProfileSummary } from "@/application/profile/ports/ProfileRepo";

export type ProfileSummaryPayload = {
  user: { id: string; name: string; email: string; role?: string };
  stats?: { completed?: number; canceled?: number; total?: number };
};

function normalizeRole(r?: string): ProfileSummary["user"]["role"] {
  const v = (r ?? "").toLowerCase();
  if (v === "asesor" || v === "advisor") return "Asesor";
  if (v === "admin" || v === "administrator") return "Admin";
  return "Profesor";
}

export function mapProfileSummary(
  payload: ProfileSummaryPayload | { success?: boolean; data?: ProfileSummaryPayload } | null | undefined,
): ProfileSummary {
  const data = (payload as any)?.data ?? payload;
  if (!data?.user) {
    throw new Error("Perfil no disponible");
  }

  const stats = data.stats ?? {};

  return {
    user: {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: normalizeRole(data.user.role),
    },
    stats: {
      completed: stats.completed ?? 0,
      canceled: stats.canceled ?? 0,
      total: stats.total ?? (stats.completed ?? 0) + (stats.canceled ?? 0),
    },
  };
}

export class ProfileRepoHttp implements ProfileRepo {
  async getMyProfile(): Promise<ProfileSummary> {
    const payload = await httpGetCached<ProfileSummaryPayload | { success?: boolean; data?: ProfileSummaryPayload }>(
      "/profile/summary",
      { ttlMs: 30_000 },
    );

    return mapProfileSummary(payload);
  }
}
