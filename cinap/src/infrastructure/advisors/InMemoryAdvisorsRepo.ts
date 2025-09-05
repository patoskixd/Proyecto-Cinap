import type { AdvisorsRepo, UpdateAdvisorDTO } from "@application/advisors/ports/AdvisorsRepo";
import type { Advisor, AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";



const genId = () =>
  typeof globalThis !== "undefined" &&
  globalThis.crypto &&
  typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `adv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export class InMemoryAdvisorsRepo implements AdvisorsRepo {
  private items: Advisor[] = [
    {
      id: "a1",
      basic: { name: "Dr. María González", email: "maria.gonzalez@universidad.edu" },
      categories: ["tec", "invest"] as CategoryId[],
      services: [
        { categoryId: "tec", id: "frontend" },
        { categoryId: "tec", id: "bases-datos" },
        { categoryId: "invest", id: "metodologia" },
      ],
      createdAt: "2024-01-01T09:00:00.000Z",
    },
    {
      id: "a2",
      basic: { name: "Prof. Juan Rodríguez", email: "juan.rodriguez@universidad.edu" },
      categories: ["adm"] as CategoryId[],
      services: [{ categoryId: "adm", id: "finanzas" }],
      createdAt: "2024-01-02T09:00:00.000Z",
    },
  ];

  async list() {
    return JSON.parse(JSON.stringify(this.items)) as Advisor[];
  }

  async add(input: { basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] }) {
    const item: Advisor = {
      id: genId(), 
      basic: input.basic,
      categories: input.categories,
      services: input.services,
      createdAt: new Date().toISOString(),
    };
    this.items.push(item);
    return JSON.parse(JSON.stringify(item));
  }

  async update(id: string, changes: UpdateAdvisorDTO) {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error("Advisor not found");
    const current = this.items[idx];
    const next: Advisor = {
      ...current,
      ...(changes.basic ? { basic: changes.basic } : {}),
      ...(changes.categories ? { categories: changes.categories } : {}),
      ...(changes.services ? { services: changes.services } : {}),
    };
    this.items[idx] = next;
    return JSON.parse(JSON.stringify(next));
  }

  async remove(id: string) {
    this.items = this.items.filter((x) => x.id !== id);
  }


  async save(input: { basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] }) {
    return this.add(input);
  }
}
