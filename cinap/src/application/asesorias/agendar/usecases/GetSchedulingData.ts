import type { SchedulingRepo, SchedulingData } from "../ports/SchedulingRepo";

export class GetSchedulingData {
  constructor(private readonly repo: SchedulingRepo) {}

  async exec(): Promise<SchedulingData> {
    const data = await this.repo.getSchedulingData();

    // (Opcional) Ordenamos para una UI consistente
    const sortByName = <T extends { name: string }>(arr: T[]) =>
      [...arr].sort((a, b) => a.name.localeCompare(b.name, "es"));

    const servicesByCategory = Object.fromEntries(
      Object.entries(data.servicesByCategory).map(([k, arr]) => [k, sortByName(arr)])
    ) as typeof data.servicesByCategory;

    const advisorsByService = Object.fromEntries(
      Object.entries(data.advisorsByService).map(([k, arr]) => [
        k,
        [...arr].sort((a, b) => a.name.localeCompare(b.name, "es")),
      ])
    ) as typeof data.advisorsByService;

    return {
      ...data,
      categories: sortByName(data.categories),
      servicesByCategory,
      advisorsByService,
      times: [...new Set(data.times)], // evita duplicados si los hubiera
    };
  }
}
