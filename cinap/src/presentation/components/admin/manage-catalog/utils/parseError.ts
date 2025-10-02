// utils/parseError.ts
// Normaliza errores de API/servidor a mensajes legibles.
// Mapea violaciones de UNIQUE (duplicados) a textos en español.

export function parseError(err: any): string {
  try {
    const msg = err?.message ?? String(err ?? "");
    const status = err?.status ?? err?.response?.status;
    const data = err?.response?.data ?? err?.data ?? {};
    const code = err?.code ?? data?.code;
    const detail = data?.detail ?? err?.detail ?? "";
    const full = [msg, detail].filter(Boolean).join(" ");

    // Duplicados (Postgres 23505, o textos típicos)
    if (code === "23505" || /unique|duplicad[oa]|already exists|ya existe/i.test(full)) {
      if (/servicio|service/i.test(full)) return "Ya existe un servicio con ese nombre en esta categoría.";
      if (/categor(i|í)a|category/i.test(full)) return "Ya existe una categoría con ese nombre.";
      return "Ya existe un registro con esos datos.";
    }

    // Otras situaciones típicas
    if (status === 400) return "Datos inválidos. Revisa los campos e inténtalo de nuevo.";
    if (status === 404) return "El recurso no existe o fue eliminado.";
    if (status === 409) return "Conflicto con los datos enviados.";
    if (status === 500) return "Ocurrió un error en el servidor. Inténtalo más tarde.";

    // Fallback
    return msg || "Algo salió mal. Intenta de nuevo.";
  } catch {
    return "Ocurrió un error inesperado.";
  }
}
