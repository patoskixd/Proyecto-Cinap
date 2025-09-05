import type { AuthRepo } from "../ports/AuthRepo";
import type { Me } from "@/domain/auth";

export const makeGetMe = (repo: AuthRepo) => {
  return async (): Promise<Me> => repo.getMe();
};
