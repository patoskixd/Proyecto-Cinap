import { headers } from "next/headers";
import type { ProfileSummary } from "@/application/profile/ports/ProfileRepo";
import { GetMyProfile } from "@/application/profile/usecases/GetMyProfile";
import ProfileScreen from "@presentation/components/profile/ProfileScreen";
import { ProfileBackendRepo } from "@/infrastructure/http/bff/profile/ProfileBackendRepo";

export const metadata = { title: "Mi Perfil - CINAP" };
export const dynamic = "force-dynamic";

export default async function Page() {
  let initialProfile: ProfileSummary | null = null;

  try {
    const hdrs = await headers();
    const cookie = hdrs.get("cookie") ?? "";
    const repo = new ProfileBackendRepo(cookie);
    initialProfile = await new GetMyProfile(repo).execute();
  } catch {
    initialProfile = null;
  }

  return <ProfileScreen initialProfile={initialProfile} />;
}
