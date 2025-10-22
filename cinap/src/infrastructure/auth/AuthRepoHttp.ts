import type { AuthRepo } from "@/application/auth/ports/AuthRepo";
import type { Me } from "@/domain/auth";
import { httpGetCached, httpPost } from "@/infrastructure/http/client";

export class AuthRepoHttp implements AuthRepo {
  async login(email: string, password: string): Promise<any> {
    return httpPost("/auth/login", { email, password });
  }
  async getMe(): Promise<Me> {
    return httpGetCached<Me>("/auth/me");
  }
  async signOut(): Promise<void> {
    await httpPost("/auth/logout", {});
  }
  async reissue(): Promise<void> {
    await httpPost("/auth/reissue", {});
  }
}
