export type Role = "teacher" | "advisor" | "admin";

/** Acepta alias en español si te llega “asesor” desde la URL o sesión */
export function normalizeRole(r?: string): Role {
  const v = (r ?? "").toLowerCase();
  if (v === "advisor" || v === "asesor") return "advisor";
  if (v === "admin") return "admin";
  return "teacher"; // default
}
