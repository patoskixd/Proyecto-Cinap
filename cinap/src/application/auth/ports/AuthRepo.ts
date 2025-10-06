
import type { Me } from "@/domain/auth";

export interface AuthRepo {
  login(email: string, password: string): Promise<any>;
  getMe(): Promise<Me>;
  signOut(): Promise<void>;
  reissue(): Promise<void>;
}
