type DetailObj = {
  message?: string;
  code?: string;
  errors?: unknown;
  detail?: unknown;
  [k: string]: unknown;
};

function extractData(err: unknown): any {
  const anyErr = err as any;
  if (anyErr?.response?.data !== undefined) return anyErr.response.data;
  if (anyErr?.data !== undefined) return anyErr.data;
  if (anyErr?.detail !== undefined) return anyErr.detail;
  if (anyErr?.body !== undefined) return anyErr.body;
  if (anyErr?.payload !== undefined) return anyErr.payload;
  if (anyErr?.error !== undefined) return anyErr.error;
  return undefined;
}

function resolveDetail(input: unknown): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const firstChar = trimmed[0];
    const lastChar = trimmed[trimmed.length - 1];
    const looksJson =
      (firstChar === "{" && lastChar === "}") || (firstChar === "[" && lastChar === "]");

    if (looksJson) {
      try {
        const parsed = JSON.parse(trimmed);
        const parsedDetail = resolveDetail(parsed);
        if (parsedDetail) return parsedDetail;
      } catch {
        /* ignore JSON parse errors; fall through */
      }
    }

    return trimmed;
  }

  if (Array.isArray(input)) {
    const messages = (input as unknown[]).reduce<string[]>((acc, item) => {
      const msg =
        resolveDetail((item as any)?.msg) ||
        resolveDetail((item as any)?.message) ||
        resolveDetail(item);
      if (msg) acc.push(msg);
      return acc;
    }, []);
    if (messages.length) return messages.join(", ");
    return null;
  }

  if (typeof input === "object") {
    const obj = input as DetailObj;

    if (typeof (obj as any).msg === "string" && (obj as any).msg.trim()) {
      return (obj as any).msg.trim();
    }

    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim();
    }

    if (Array.isArray(obj.errors) && obj.errors.length) {
      const msgs = (obj.errors as unknown[]).map((errItem) => resolveDetail(errItem)).filter(Boolean) as string[];
      if (msgs.length) return msgs.join(", ");
    }

    if (obj.code) {
      switch (obj.code) {
        case "DUPLICATE_CATEGORY_NAME":
          return obj.message || "Ya existe una categoria con ese nombre.";
        case "DUPLICATE_SERVICE_NAME":
          return obj.message || "Ya existe un servicio con ese nombre en esa categoria.";
        default:
          return obj.message || `Error: ${obj.code}`;
      }
    }

    const nested =
      resolveDetail(obj.detail) ||
      resolveDetail((obj as any).error) ||
      resolveDetail((obj as any).payload) ||
      resolveDetail((obj as any).body);
    if (nested) return nested;
  }

  return null;
}

export function parseError(err: unknown): string {
  try {
    if (!err) return "Ha ocurrido un error.";
    if (typeof err === "string") {
      const fromString = resolveDetail(err);
      return fromString || "Ha ocurrido un error.";
    }

    if (err instanceof Error && err.message && err.message !== "Failed to fetch") {
      const cleaned = resolveDetail(err.message);
      return cleaned || err.message;
    }

    const data = extractData(err);
    const detailSource = data?.detail !== undefined ? data.detail : data;
    const detail = resolveDetail(detailSource);

    if (detail) return detail;

    const directDetail = resolveDetail((err as any)?.detail);
    if (directDetail) return directDetail;

    if ((err as any)?.status) {
      const st = `Error ${(err as any).status}${(err as any).statusText ? `: ${(err as any).statusText}` : ""}`;
      return st;
    }

    if (err instanceof Error && err.message === "Failed to fetch") {
      return "No se pudo conectar con el servidor.";
    }

    return "Error inesperado. Intentalo de nuevo.";
  } catch {
    return "Error inesperado.";
  }
}
