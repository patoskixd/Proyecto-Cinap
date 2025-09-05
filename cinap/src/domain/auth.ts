export type Role = "teacher" | "advisor" | "admin";

export function normalizeRole(r?: string): Role {
  const v = (r ?? "").toLowerCase();
  if (v === "advisor" || v === "asesor") return "advisor";
  if (v === "admin") return "admin";
  return "teacher";
}

export type UserDTO = {
  id: string;
  email: string;
  name: string;
  role: string; 
};

export type Me =
  | { authenticated: false }
  | { authenticated: true; user: UserDTO };
