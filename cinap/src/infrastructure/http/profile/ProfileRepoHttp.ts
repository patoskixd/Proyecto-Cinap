import { httpGetCached } from "@/infrastructure/http/client";
import type { ProfileRepo, ProfileSummary } from "@/application/profile/ports/ProfileRepo";

type MeWrapped =
  | { authenticated: false }
  | { authenticated: true; user: { id: string; email: string; name: string; role?: string } };

type MeFlat = { id: string; email: string; name: string; role?: string };

function unwrap(me: MeWrapped | MeFlat): MeFlat {
  if (typeof (me as any).authenticated !== "undefined") {
    const mw = me as MeWrapped;
    if (!mw.authenticated) throw new Error("UNAUTHENTICATED");
    return mw.user;
  }
  return me as MeFlat;
}

function normalizeRole(r?: string): ProfileSummary["user"]["role"] {
  const v = (r ?? "").toLowerCase();
  if (v === "asesor" || v === "advisor") return "Asesor" as ProfileSummary["user"]["role"];
  if (v === "admin" || v === "administrator") return "Admin" as ProfileSummary["user"]["role"];
  return "Profesor" as ProfileSummary["user"]["role"];
}

export class ProfileRepoHttp implements ProfileRepo {
  async getMyProfile(): Promise<ProfileSummary> {
    const me = await httpGetCached<MeWrapped | MeFlat>("/auth/me", { ttlMs: 60_000 });
    const u = unwrap(me);

    // Estatico por ahora ya que no genero estas metricas aun
    const completed = 0;
    const canceled = 0;

    return {
      user: { id: u.id, name: u.name, email: u.email, role: normalizeRole(u.role) },
      stats: { completed, canceled },
    };
  }
}
