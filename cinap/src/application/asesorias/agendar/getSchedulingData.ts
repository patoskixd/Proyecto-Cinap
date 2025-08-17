// src/application/asesoria/agendar/getSchedulingData.ts
import type { Advisor, Category, CategoryId, Service } from "@/domain/scheduling";

export async function getSchedulingData(): Promise<{
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  advisorsByService: Record<string, Advisor[]>;
  daysShort: string[];         // ["Lun 15", "Mar 16", ...] 
  times: string[];             // ["09:00","10:30",...]
  defaultTimezone: string;     // para el selector
}> {
  const categories: Category[] = [
    { id: "academica",     icon: "📚", name: "Asesoría Académica",     description: "Apoyo en materias y estudio" },
    { id: "investigacion", icon: "🔬", name: "Investigación",          description: "Proyectos y metodología" },
    { id: "tesis",         icon: "📝", name: "Tesis y Trabajos",       description: "Elaboración y defensa" },
    { id: "tecnologia",    icon: "💻", name: "Tecnología",             description: "Herramientas y software" },
  ];

  const servicesByCategory = {
    academica: [
      { id: "math",     categoryId: "academica", name: "Matemáticas",            description: "Álgebra, cálculo y estadística", duration: "60 min" },
      { id: "physics",  categoryId: "academica", name: "Física",                  description: "Mecánica, termodinámica, óptica", duration: "90 min" },
      { id: "chemistry",categoryId: "academica", name: "Química",                 description: "Orgánica e inorgánica",           duration: "60 min" },
    ],
    investigacion: [
      { id: "methodology",categoryId:"investigacion", name:"Metodología",         description:"Diseño y métodos",                 duration:"90 min" },
      { id: "statistics", categoryId:"investigacion", name:"Estadística",         description:"Análisis de datos",                duration:"60 min" },
      { id: "writing",    categoryId:"investigacion", name:"Redacción Científica",description:"Artículos y papers",               duration:"120 min" },
    ],
    tesis: [
      { id: "proposal",  categoryId:"tesis", name:"Propuesta de Tesis",           description:"Propuesta inicial",                duration:"90 min" },
      { id: "structure", categoryId:"tesis", name:"Estructura",                   description:"Organización del documento",       duration:"60 min" },
      { id: "defense",   categoryId:"tesis", name:"Preparación de Defensa",       description:"Presentación",                     duration:"120 min" },
    ],
    tecnologia: [
      { id: "programming",categoryId:"tecnologia", name:"Programación",           description:"Python, R, SPSS",                  duration:"90 min" },
      { id: "software",   categoryId:"tecnologia", name:"Software Especializado",  description:"MATLAB, AutoCAD",                  duration:"60 min" },
      { id: "databases",  categoryId:"tecnologia", name:"Bases de Datos",          description:"SQL, MongoDB",                     duration:"90 min" },
    ],
  }satisfies Record<CategoryId, Service[]>;

  const advisorsByService: Record<string, Advisor[]> = {
    math: [
      { id:"advisor1", name:"Dr. María González",  email:"maria.gonzalez@cinap.edu",  specialties:["Álgebra","Cálculo"] },
      { id:"advisor2", name:"Prof. Carlos Ruiz",   email:"carlos.ruiz@cinap.edu",     specialties:["Estadística","Probabilidad"] },
    ],
    physics: [
      { id:"advisor3", name:"Dr. Ana López",       email:"ana.lopez@cinap.edu",       specialties:["Mecánica","Termodinámica"] },
    ],
    chemistry: [
      { id:"advisor4", name:"Dra. Luis Martín",    email:"luis.martin@cinap.edu",     specialties:["Química Orgánica"] },
    ],
    methodology: [
      { id:"advisor5", name:"Dr. Patricia Silva",  email:"patricia.silva@cinap.edu",  specialties:["Metodología","Diseño"] },
    ],
    statistics: [
      { id:"advisor2", name:"Prof. Carlos Ruiz",   email:"carlos.ruiz@cinap.edu",     specialties:["Estadística","SPSS"] },
    ],
    writing: [
      { id:"advisor6", name:"Dra. Elena Vargas",   email:"elena.vargas@cinap.edu",    specialties:["Redacción","Publicaciones"] },
    ],
    proposal: [
      { id:"advisor5", name:"Dr. Patricia Silva",  email:"patricia.silva@cinap.edu",  specialties:["Tesis","Investigación"] },
    ],
    structure: [
      { id:"advisor6", name:"Dra. Elena Vargas",   email:"elena.vargas@cinap.edu",    specialties:["Estructura","Formato"] },
    ],
    defense: [
      { id:"advisor7", name:"Dr. Roberto Díaz",    email:"roberto.diaz@cinap.edu",    specialties:["Presentaciones","Defensa"] },
    ],
    programming: [
      { id:"advisor8", name:"Ing. Sofia Chen",     email:"sofia.chen@cinap.edu",      specialties:["Python","R"] },
    ],
    software: [
      { id:"advisor9", name:"Ing. Miguel Torres",  email:"miguel.torres@cinap.edu",   specialties:["MATLAB","AutoCAD"] },
    ],
    databases: [
      { id:"advisor8", name:"Ing. Sofia Chen",     email:"sofia.chen@cinap.edu",      specialties:["SQL","MongoDB"] },
    ],
  };

  const daysShort = ["Lun 15", "Mar 16", "Mié 17", "Jue 18", "Vie 19"];
  const times = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

  return {
    categories,
    servicesByCategory,
    advisorsByService,
    daysShort,
    times,
    defaultTimezone: "America/Santiago",
  };
}
