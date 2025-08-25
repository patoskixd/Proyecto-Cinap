import type { DashboardRepo, DashboardData, DashboardInput } from "../ports/DashboardRepo";

export class GetDashboard {
  constructor(private readonly repo: DashboardRepo) {}

  async exec(input: DashboardInput): Promise<DashboardData> {
    // Aquí puedes añadir reglas transversales (ordenamientos, filtros por fecha, etc.)
    return this.repo.getDashboard(input);
  }
}
