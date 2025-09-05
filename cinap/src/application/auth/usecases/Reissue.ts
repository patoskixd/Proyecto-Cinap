import type { AuthRepo } from "../ports/AuthRepo";

export const makeReissue = (repo: AuthRepo) => {
  return async (): Promise<void> => repo.reissue();
};
