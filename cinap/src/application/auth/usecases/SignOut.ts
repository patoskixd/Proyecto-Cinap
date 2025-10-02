import type { AuthRepo } from "../ports/AuthRepo";

export const makeSignOut = (repo: AuthRepo) => {
  return async (): Promise<void> => repo.signOut();
};
