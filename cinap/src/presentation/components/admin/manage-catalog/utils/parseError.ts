// utils/parseError.ts
type DetailObj = {
  message?: string;
  code?: string;
  errors?: any;
  [k: string]: any;
};

function extractData(err: any): any {
  // axios-style
  if (err?.response?.data !== undefined) return err.response.data;
  // fetch-style custom (ver más abajo)
  if (err?.data !== undefined) return err.data;
  // FastAPI error pasado directo
  if (err?.detail !== undefined) return err.detail;
  // algún wrapper raro
  if (err?.body !== undefined) return err.body;
  if (err?.payload !== undefined) return err.payload;
  if (err?.error !== undefined) return err.error;
  return undefined;
}

export function parseError(err: any): string {
  try {
    if (!err) return "Ha ocurrido un error.";
    if (typeof err === "string") return err;

    // Mensaje de Error estándar
    if (err instanceof Error && err.message && err.message !== "Failed to fetch") {
      // Ojo: "Failed to fetch" suele ser CORS/conectividad; lo tratamos más abajo.
      return err.message;
    }

    const data = extractData(err);

    // FastAPI: detail puede ser string u objeto
    const detail = data?.detail !== undefined ? data.detail : data;

    // 1) detail string
    if (typeof detail === "string" && detail.trim()) return detail.trim();

    // 2) detail objeto con { message, code, errors }
    if (detail && typeof detail === "object") {
      const d = detail as DetailObj;

      if (typeof d.message === "string" && d.message.trim()) return d.message.trim();

      // Pydantic / FastAPI validation errors
      if (Array.isArray(d) && d.length && typeof d[0]?.msg === "string") {
        return d.map((e: any) => e.msg).join(", ");
      }
      if (!Array.isArray(d) && Array.isArray(d.errors) && d.errors.length) {
        const msgs = d.errors
          .map((e: any) => e?.message || e?.msg || JSON.stringify(e))
          .filter(Boolean);
        if (msgs.length) return msgs.join(", ");
      }

      // Códigos propios (los que te propuse en el backend)
      if (!Array.isArray(d) && d.code) {
        switch (d.code) {
          case "DUPLICATE_CATEGORY_NAME":
            return d.message || "Ya existe una categoría con ese nombre.";
          case "DUPLICATE_SERVICE_NAME":
            return d.message || "Ya existe un servicio con ese nombre en esa categoría.";
          default:
            return d.message || `Error: ${d.code}`;
        }
      }

      // Si el objeto trae 'detail' anidado
      if (!Array.isArray(d) && typeof d.detail === "string" && d.detail.trim()) return d.detail.trim();
      if (!Array.isArray(d) && d.detail && typeof d.detail === "object") {
        const inner = (d.detail.message || d.detail.msg || "").trim();
        if (inner) return inner;
      }
    }

    // 3) FastAPI: err.detail directamente
    if (typeof err?.detail === "string" && err.detail.trim()) return err.detail.trim();

    // 4) HTTP status genérico
    if (err?.status) {
      const st = `Error ${err.status}${err.statusText ? `: ${err.statusText}` : ""}`;
      return st;
    }

    // 5) Network/CORS
    if (err instanceof Error && err.message === "Failed to fetch") {
      return "No se pudo conectar con el servidor.";
    }

    // Fallback
    return "Error inesperado. Inténtalo de nuevo.";
  } catch {
    return "Error inesperado.";
  }
}
