import type { AdminAdvisorRepo } from "@/application/admin/advisors/ports/AdminAdvisorRepo";
import type { 
  Advisor, 
  AdvisorId, 
  RegisterAdvisorRequest, 
  UpdateAdvisorRequest,
  AdvisorServiceInfo
} from "@/domain/admin/advisors";

export class AdminAdvisorsBackendRepo implements AdminAdvisorRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private setCookies: string[] = [];

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    this.cookie = cookie;
  }

  getSetCookies(): string[] {
    return this.setCookies;
  }

  collectSetCookies(res: Response): void {
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      this.setCookies.push(setCookie);
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    this.collectSetCookies(res);
    const txt = await res.text();
    try { 
      return JSON.parse(txt) as T; 
    } catch { 
      throw new Error(txt || `HTTP ${res.status}`); 
    }
  }

  private mapBackendToAdvisor(backendData: any): Advisor {
    return {
      id: backendData.id || "",
      basic: {
        name: backendData.name || "",
        email: backendData.email || ""
      },
      services: backendData.services?.map((service: any): AdvisorServiceInfo => ({
        id: service.id || "",
        name: service.name || "",
        categoryId: service.category_id || "",
        categoryName: service.category_name || ""
      })) || [],
      categories: backendData.categories || [],
      active: backendData.activo ?? true,
      createdAt: backendData.created_at || new Date().toISOString()
    };
  }

  async list(): Promise<Advisor[]> {
    const res = await fetch(`${this.baseUrl}/admin/advisors/`, {
      method: "GET",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json" 
      },
      credentials: "include",
      cache: "no-store",
    });
    
    if (!res.ok) {
      throw new Error(await res.text() || "No se pudieron cargar los asesores");
    }
    
    const backendData = await this.parse<any[]>(res);
    return backendData.map(data => this.mapBackendToAdvisor(data));
  }

  async add(request: RegisterAdvisorRequest): Promise<Advisor> {
    const backendPayload = {
      name: request.basic.name,
      email: request.basic.email,
      service_ids: request.services
    };
    
    const res = await fetch(`${this.baseUrl}/admin/advisors`, {
      method: "POST",
      headers: { 
        "content-type": "application/json", 
        accept: "application/json", 
        cookie: this.cookie 
      },
      credentials: "include",
      body: JSON.stringify(backendPayload),
      cache: "no-store",
    });
    
    const data = await this.parse<any>(res);
    
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "No se pudo registrar el asesor");
    }
    
    return this.mapBackendToAdvisor(data);
  }

  async update(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor> {
    const backendPayload: any = {};
    
    if (changes.basic) {
      if (changes.basic.name !== undefined) backendPayload.name = changes.basic.name;
      if (changes.basic.email !== undefined) backendPayload.email = changes.basic.email;
    }
    
    if (changes.services) {
      backendPayload.service_ids = changes.services;
    }
    
    if (changes.active !== undefined) {
      backendPayload.active = changes.active;
    }
    
    const res = await fetch(`${this.baseUrl}/admin/advisors/${id}`, {
      method: "PATCH",
      headers: { 
        "content-type": "application/json", 
        accept: "application/json", 
        cookie: this.cookie 
      },
      credentials: "include",
      body: JSON.stringify(backendPayload),
      cache: "no-store",
    });
    
    const data = await this.parse<any>(res);
    
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "No se pudo actualizar el asesor");
    }
    
    return this.mapBackendToAdvisor(data);
  }

  async remove(id: AdvisorId): Promise<Advisor> {
    const res = await fetch(`${this.baseUrl}/admin/advisors/${id}`, {
      method: "DELETE",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json" 
      },
      credentials: "include",
      cache: "no-store",
    });
    
    const data = await this.parse<any>(res);
    
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || "No se pudo eliminar el asesor");
    }
    
    return this.mapBackendToAdvisor(data);
  }
}
