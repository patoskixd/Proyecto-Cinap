import { httpGetCached } from "@/infrastructure/http/client";
import type { ProfileRepo, ProfileSummary } from "@/application/profile/ports/ProfileRepo";

type SummaryPayload = {
  user: { id: string; name: string; email: string; role?: string };
  stats: { completed?: number; canceled?: number; total?: number };
};

function normalizeRole(r?: string): ProfileSummary["user"]["role"] {
  const v = (r ?? "").toLowerCase();
  if (v === "asesor" || v === "advisor") return "Asesor";
  if (v === "admin" || v === "administrator") return "Admin";
  return "Profesor";
}

export class ProfileRepoHttp implements ProfileRepo {
  async getMyProfile(): Promise<ProfileSummary> {
    const payload = await httpGetCached<SummaryPayload>("/profile/summary", { ttlMs: 30_000 });
    const stats = payload.stats ?? {};

    return {
      user: {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
        role: normalizeRole(payload.user.role),
      },
      stats: {
        completed: stats.completed ?? 0,
        canceled: stats.canceled ?? 0,
        total:
          stats.total ??
          ((stats.completed ?? 0) + (stats.canceled ?? 0)),
      },
    };
  }
}
