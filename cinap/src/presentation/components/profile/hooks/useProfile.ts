"use client";
import { useEffect, useState } from "react";
import { GetMyProfile } from "@/application/profile/usecases/GetMyProfile";
import { ProfileRepoHttp } from "@/infrastructure/http/profile/ProfileRepoHttp";
import type { ProfileSummary } from "@/application/profile/ports/ProfileRepo";

export function useProfile() {
  const [data, setData] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uc = new GetMyProfile(new ProfileRepoHttp());
    uc.execute()
      .then(setData)
      .catch((e: any) => setError(e?.message ?? "Error al cargar perfil"))
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}
