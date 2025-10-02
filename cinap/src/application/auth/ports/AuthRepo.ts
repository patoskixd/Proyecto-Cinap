
import type { Me } from "@/domain/auth";

export interface AuthRepo {
  getMe(): Promise<Me>;
  signOut(): Promise<void>;
  reissue(): Promise<void>;
}
