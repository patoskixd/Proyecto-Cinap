import type { AuthRepo } from "@application/auth/ports/AuthRepo";
import type { Me } from "@/domain/auth";

export class AuthBackendRepo implements AuthRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ?? "";
    this.cookie = cookie;
  }

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie")
            ? [res.headers.get("set-cookie") as string]
            : []);
    this.lastSetCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    if (res.status === 204) return {} as T;
    const txt = await res.text();
    try { 
      return JSON.parse(txt) as T; 
    } catch { 
      throw new Error(txt || `HTTP ${res.status}`); 
    }
  }

  async login(email: string, password: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json", 
        "content-type": "application/json" 
      },
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
      body: JSON.stringify({ email, password }),
    });
    
    this.collectSetCookies(res);
    
    if (!res.ok) {
      const errorData = await this.parse<any>(res);
      throw new Error(errorData?.detail || errorData?.message || `HTTP ${res.status}`);
    }
    
    return this.parse<any>(res);
  }

  async getMe(): Promise<Me> {
    const res = await fetch(`${this.baseUrl}/api/auth/me`, {
      method: "GET",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json" 
      },
      credentials: "include",
      cache: "no-store",
    });
    
    this.collectSetCookies(res);
    
    if (!res.ok) {
      console.error(`Backend /auth/me error: ${res.status}`, await res.text().catch(() => ""));
      if (res.status === 401 || res.status === 403) {
        return { authenticated: false };
      }
      throw new Error(`Error al obtener información del usuario: ${res.status}`);
    }
    
    return this.parse<Me>(res);
  }

  async signOut(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json",
        "content-type": "application/json" 
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({}),
    });
    
    this.collectSetCookies(res);
    
    if (!res.ok && res.status !== 204) {
      const errorData = await this.parse<any>(res);
      throw new Error(errorData?.detail || errorData?.message || `HTTP ${res.status}`);
    }
  }

  async reissue(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/auth/reissue`, {
      method: "POST",
      headers: { 
        cookie: this.cookie, 
        accept: "application/json",
        "content-type": "application/json" 
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({}),
    });
    
    this.collectSetCookies(res);
    
    if (!res.ok) {
      const errorData = await this.parse<any>(res);
      throw new Error(errorData?.detail || errorData?.message || `HTTP ${res.status}`);
    }
  }

  async startGoogleLogin(): Promise<{ redirectUrl: string; status: number }> {
    if (!this.baseUrl) {
      throw new Error("BACKEND_URL no está configurado");
    }

    const res = await fetch(`${this.baseUrl}/api/auth/google/login`, {
      method: "GET",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
    });

    this.collectSetCookies(res);

    const location = res.headers.get("location");
    if (location) {
      return { redirectUrl: location, status: res.status || 302 };
    }

    const errorData = await this.parse<any>(res);
    throw new Error(errorData?.detail || errorData?.message || `HTTP ${res.status}`);
  }
}
