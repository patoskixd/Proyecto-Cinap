import type { ProfileRepo, ProfileSummary } from "../ports/ProfileRepo";

export class GetMyProfile {
  constructor(private repo: ProfileRepo) {}
  async execute(): Promise<ProfileSummary> {
    return this.repo.getMyProfile();
  }
}
