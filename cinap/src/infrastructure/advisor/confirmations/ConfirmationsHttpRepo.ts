import type { ConfirmationsRepo } from "@/application/advisor/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export class HttpConfirmationsRepo implements ConfirmationsRepo {
  async getPending(): Promise<PendingConfirmation[]> {
    const isServer = typeof window === "undefined";

    let url = "/api/advisor/confirmations/pending";
    const init: RequestInit = { credentials: "include", cache: "no-store" };

    if (isServer) {
      const mod = await import("next/headers");


      const h = typeof (mod as any).headers === "function"
        ? await (mod as any).headers()
        : (mod as any).headers;

      const c = typeof (mod as any).cookies === "function"
        ? await (mod as any).cookies()
        : (mod as any).cookies;

      const proto = h?.get("x-forwarded-proto") ?? "http";
      const host  = h?.get("x-forwarded-host") ?? h?.get("host");
      if (!host) throw new Error("No host header in request");

      url = `${proto}://${host}${url}`;
      init.headers = { cookie: c?.toString?.() ?? "" };
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Error cargando confirmaciones");
    }
    return res.json();
    
  }
  
}
