// src/infrastructure/advisor-catalog/InMemoryAdvisorCatalogRepo.ts
import type { AdvisorCatalogRepo } from "@application/advisor-catalog/ports/AdvisorCatalogRepo";
import type { AdvisorCatalog, AdvisorCategory } from "@domain/advisorCatalog";
import type { Category, Service, CategoryId } from "@domain/scheduling";

const mkCat = (id: CategoryId, name: string, description: string, icon: string): Category => ({
  id, name, description, icon,
});

// ⬇️ AHORA incluye categoryId (requerido por Service)
const mkSvc = (
  id: string,
  categoryId: CategoryId,
  name: string,
  description: string,
  duration: string = "60"
): Service => ({
  id,
  categoryId,   // <-- requerido
  name,
  description,
  duration,     // si tu Service usa number, cambia a: Number(duration)
});

export class InMemoryAdvisorCatalogRepo implements AdvisorCatalogRepo {
  private active: AdvisorCategory[];
  private available: AdvisorCategory[];

  constructor() {
    this.active = [
      {
        category: mkCat("tech" as CategoryId, "Tecnología e Informática", "Asesorías en desarrollo de software, programación y tecnologías emergentes", "💻"),
        services: [
          mkSvc("web", "tech" as CategoryId, "Programación Web", "Frontend/Backend"),
          mkSvc("db", "tech" as CategoryId, "Bases de Datos", "SQL/NoSQL"),
          mkSvc("ai", "tech" as CategoryId, "Inteligencia Artificial", "ML, NLP"),
        ],
        status: "active",
      },
      {
        category: mkCat("biz" as CategoryId, "Administración y Negocios", "Gestión empresarial, finanzas y estrategia", "📊"),
        services: [
          mkSvc("pm", "biz" as CategoryId, "Gestión de Proyectos", "PMI/Agile"),
          mkSvc("fin", "biz" as CategoryId, "Finanzas Corporativas", "Valorización/Costos"),
        ],
        status: "active",
      },
      {
        category: mkCat("science" as CategoryId, "Ciencias e Investigación", "Metodología de investigación y análisis científico", "🔬"),
        services: [
          mkSvc("meth", "science" as CategoryId, "Metodología de Investigación", "Diseños"),
          mkSvc("stat", "science" as CategoryId, "Análisis Estadístico", "R/Python"),
          mkSvc("write", "science" as CategoryId, "Redacción Científica", "Artículos/Tesis"),
        ],
        status: "active",
      },
    ];

    this.available = [
      {
        category: mkCat("art" as CategoryId, "Arte y Diseño", "Diseño gráfico, arte digital y creatividad visual", "🎨"),
        services: [
          mkSvc("design", "artfr" as CategoryId, "Diseño Gráfihhho", "Fundamentos/Branding"),
          mkSvc("illu", "artg" as CategoryId, "Ilustración Digihjhjtal", "Tableta/Vector"),
          mkSvc("ux", "art" as CategoryId, "UX/Uhjhj Design", "Inveshigación/Prototipos"),
                    mkSvc("design", "art" as CategoryId, "Diseño Gráfico", "Fundamentos/Branding"),
          mkSvc("illu", "art" as CategoryId, "Ilustracióhjhjn Digital", "Tableta/Vector"),
          mkSvc("ux", "art" as CategoryId, "UX/UI Desihjhjgn", "Investigación/Prototipos"),
                    mkSvc("design", "art" as CategoryId, "Diseño Gráfico", "Fundamentos/Branding"),
          mkSvc("illu", "art" as CategoryId, "Ilustración Digital", "Tableta/Vector"),
          mkSvc("ux", "art" as CategoryId, "UX/UIhjhj Design", "Investigación/Prototipos"),
                    mkSvc("design", "art" as CategoryId, "Diseño Gráfico", "Fundamentos/Branding"),
          mkSvc("illu", "art" as CategoryId, "Ilustración Digital", "Tableta/Vector"),
          mkSvc("ux", "art" as CategoryId, "UX/UI Design", "Investigación/Prototipos"),
                    mkSvc("design", "art" as CategoryId, "Diseño Grághghfico", "Fundamentos/Branding"),
          mkSvc("illu", "art" as CategoryId, "Ilustraciónghgh Digital", "Tableta/Vector"),
          mkSvc("ux", "art" as CategoryId, "UX/UI Desgfhgign", "Investigación/Prototipos"),
        ],
        status: "available",
      },
      {
        category: mkCat("lang" as CategoryId, "Idiomas y Comunicación", "Idiomas y habilidades comunicativas", "🌍"),
        services: [
          mkSvc("eng", "lang" as CategoryId, "Inglés Avanzado", "Académico"),
          mkSvc("speaking", "lang" as CategoryId, "Comunicación Oral", "Presentaciones"),
          mkSvc("writing", "lang" as CategoryId, "Redacción Académica", "Ensayos"),
        ],
        status: "available",
      },
      {
        category: mkCat("law" as CategoryId, "Derecho y Jurisprudencia", "Temas legales y normativas", "⚖️"),
        services: [
          mkSvc("civil", "law" as CategoryId, "Derecho Civil", "Contratos"),
          mkSvc("labor", "law" as CategoryId, "Derecho Laboral", "RRHH"),
          mkSvc("edu", "law" as CategoryId, "Normativas Educativas", "Reglamentos"),
        ],
        status: "available",
      },
      {
        category: mkCat("health" as CategoryId, "Salud y Bienestar", "Salud, bienestar y desarrollo personal", "🏥"),
        services: [
          mkSvc("psy", "health" as CategoryId, "Psicología Educativa", "Orientación"),
          mkSvc("nutri", "health" as CategoryId, "Nutrición", "Hábitos"),
          mkSvc("well", "health" as CategoryId, "Bienestar Laboral", "Estrés"),
        ],
        status: "available",
      },
    ];
  }

  async list(): Promise<AdvisorCatalog> {
    const activeServices = this.active.reduce((n, c) => n + c.services.length, 0);
    return {
      active: this.active.map(x => ({ ...x })),
      available: this.available.map(x => ({ ...x })),
      stats: {
        activeCategories: this.active.length,
        activeServices,
      },
    };
  }

  async joinCategory({ categoryId }: { categoryId: CategoryId }): Promise<void> {
    const i = this.available.findIndex(c => c.category.id === categoryId);
    if (i === -1) return;
    const cat = this.available.splice(i, 1)[0];
    this.active.unshift({ ...cat, status: "active" });
  }

  async leaveCategory({ categoryId }: { categoryId: CategoryId }): Promise<void> {
    const i = this.active.findIndex(c => c.category.id === categoryId);
    if (i === -1) return;
    const cat = this.active.splice(i, 1)[0];
    this.available.unshift({ ...cat, status: "available" });
  }
}
