type ProfileBackendStats = {
  completed: number;
  canceled: number;
  total: number;
};

type ProfileBackendResponse = {
  success: boolean;
  data: {
    user: { id: string; name: string; email: string; role: string };
    stats: ProfileBackendStats;
  };
};

export class ProfileBackendRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private setCookies: string[] = [];

  constructor(cookie: string) {
    this.baseUrl =
      process.env.BACKEND_URL ??
      "";
    this.cookie = cookie ?? "";
  }

  getSetCookies(): string[] {
    return this.setCookies;
  }

  private collectSetCookies(res: Response) {
    this.setCookies = [];
    const anyHeaders = res.headers as any;
    if (typeof anyHeaders.getSetCookie === "function") {
      this.setCookies = anyHeaders.getSetCookie();
    } else {
      const cookie = res.headers.get("set-cookie");
      if (cookie) this.setCookies.push(cookie);
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  async getSummary(): Promise<ProfileBackendResponse["data"]> {
    const res = await fetch(`${this.baseUrl}/api/profile/summary`, {
      method: "GET",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);

    if (!res.ok) {
      const message = await res.text().catch(() => "");
      throw new Error(message || "No se pudo cargar el perfil");
    }

    const payload = await this.parse<ProfileBackendResponse>(res);
    if (!payload.success) {
      throw new Error("Respuesta inválida del backend");
    }
    return payload.data;
  }
}
