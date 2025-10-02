import type { DashboardRepo, DashboardData, DashboardInput } from "../ports/DashboardRepo";

export class GetDashboard {
  constructor(private readonly repo: DashboardRepo) {}

  async exec(input: DashboardInput): Promise<DashboardData> {

    return this.repo.getDashboard(input);
  }
}
