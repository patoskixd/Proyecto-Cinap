import type { AuthRepo } from "@/application/auth/ports/AuthRepo";
import type { Me } from "@/domain/auth";
import { httpGet, httpPost } from "@/infrastructure/http/client";

export class AuthRepoHttp implements AuthRepo {
  async getMe(): Promise<Me> {
    return httpGet<Me>("/auth/me");
  }
  async signOut(): Promise<void> {
    await httpPost("/auth/logout", {});
  }
  async reissue(): Promise<void> {
    await httpPost("/auth/reissue", {});
  }
}
