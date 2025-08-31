import type {
  CreateSlotsData,
  CreateSlotsInput,
  CreateSlotsResult,
} from "@domain/slots";
import type { SlotsRepo } from "@app/slots/ports/SlotsRepo";
import type { Category, CategoryId, Service } from "@domain/scheduling";

export class InMemorySlotsRepo implements SlotsRepo {
  async getCreateSlotsData(): Promise<CreateSlotsData> {
    // Puedes reusar lo de getSchedulingData si quieres; lo duplico acá para dejarlo autocontenido
    const categories: Category[] = [
      { id: "academica",     icon: "📚", name: "Asesoría Académica",     description: "Apoyo en materias y estudio" },
      { id: "investigacion", icon: "🔬", name: "Investigación",          description: "Proyectos y metodología" },
      { id: "tesis",         icon: "📝", name: "Tesis y Trabajos",       description: "Elaboración y defensa" },
      { id: "tecnologia",    icon: "💻", name: "Tecnología",             description: "Herramientas y software" },
    ];

    const servicesByCategory: Record<CategoryId, Service[]> = {
      academica: [
        { id: "tutoria-matematicas", categoryId: "academica", name: "Tutoría de Matemáticas", description: "Apoyo personalizado en matemáticas", duration: "60 min" },
        { id: "tutoria-fisica",      categoryId: "academica", name: "Tutoría de Física",      description: "Resolución de problemas",          duration: "60 min" },
        { id: "metodologia-estudio", categoryId: "academica", name: "Metodología de Estudio", description: "Técnicas efectivas",                duration: "45 min" },
      ],
      investigacion: [
        { id: "metodologia-investigacion", categoryId: "investigacion", name: "Metodología de Investigación", description: "Diseño de proyectos", duration: "90 min" },
        { id: "analisis-datos",            categoryId: "investigacion", name: "Análisis de Datos",            description: "Interpretación stats", duration: "75 min" },
        { id: "redaccion-cientifica",      categoryId: "investigacion", name: "Redacción Científica",        description: "Artículos académicos", duration: "60 min" },
      ],
      tesis: [
        { id: "estructura-tesis",     categoryId: "tesis", name: "Estructura de Tesis",    description: "Organización del documento", duration: "90 min" },
        { id: "revision-bibliografia",categoryId: "tesis", name: "Revisión Bibliográfica", description: "Fuentes y análisis",         duration: "75 min" },
        { id: "defensa-tesis",        categoryId: "tesis", name: "Preparación para Defensa", description: "Presentación oral",       duration: "60 min" },
      ],
      tecnologia: [
        { id: "software-estadistico",  categoryId: "tecnologia", name: "Software Especializado", description: "SPSS, R, Python",           duration: "90 min" },
        { id: "herramientas-digitales",categoryId: "tecnologia", name: "Herramientas Digitales", description: "Apps para investigación",   duration: "60 min" },
        { id: "bases-datos",           categoryId: "tecnologia", name: "Bases de Datos",         description: "Búsqueda en repositorios",  duration: "45 min" },
      ],
    };

    const times = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

    return { categories, servicesByCategory, times };
  }

  async createSlots(input: CreateSlotsInput): Promise<CreateSlotsResult> {
    // Mock: calcula cuántos cupos se crean con la duración del servicio
    const svcDuration =
      typeof input.serviceId === "string"
        ? (() => {
            // heurística: si el id contiene "90" => 90, si contiene "75" => 75, else 60
            if (input.serviceId.includes("90")) return 90;
            if (input.serviceId.includes("75")) return 75;
            return 60;
          })()
        : 60;

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };

    const total = input.schedules.reduce((acc, s) => {
      const slots = Math.max(0, Math.floor((toMinutes(s.endTime) - toMinutes(s.startTime)) / svcDuration));
      return acc + slots;
    }, 0);

    // Simula OK
    return { createdSlots: total };
  }
}
