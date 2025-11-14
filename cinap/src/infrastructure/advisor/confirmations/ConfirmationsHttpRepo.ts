import type { ConfirmationsRepo } from "@/application/advisor/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export class HttpConfirmationsRepo implements ConfirmationsRepo {
  async getPending(): Promise<PendingConfirmation[]> {
    const isServer = typeof window === "undefined";

    let url = "/api/advisor/confirmations/pending";
    const init: RequestInit = {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    };

    if (isServer) {
      const mod = await import("next/headers");
      const h = await (mod as any).headers();
      const proto = h.get("x-forwarded-proto") || null;
      const host = h.get("x-forwarded-host") || h.get("host") || null;

      if (proto && host) {
        url = `${proto}://${host}${url}`;
      } else {
        const fallbackBase =
          process.env.APP_INTERNAL_ORIGIN ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "";
        if (!fallbackBase) {
          throw new Error("No se pudo resolver el origin para confirmaciones (APP_INTERNAL_ORIGIN o NEXT_PUBLIC_SITE_URL)");
        }
        url = `${fallbackBase.replace(/\/$/, "")}${url}`;
      }

      init.headers = {
        ...(init.headers as Record<string, string>),
        cookie: h.get("cookie") || "",
      };
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (controller) {
      init.signal = controller.signal;
    }
    const timeoutId =
      typeof setTimeout === "function" && controller
        ? setTimeout(() => controller.abort(), 4000)
        : undefined;

    try {
      const res = await fetch(url, init);
      if (!res.ok) return [];
      return (await res.json()) as PendingConfirmation[];
    } catch {
      return [];
    } finally {
      if (typeof clearTimeout === "function" && timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

}
