import type { AuthRepo } from "../ports/AuthRepo";

export const makeLogin = (repo: AuthRepo) => {
  return async (email: string, password: string): Promise<any> => repo.login(email, password);
};