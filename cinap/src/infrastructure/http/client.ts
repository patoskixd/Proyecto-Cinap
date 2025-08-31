const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api";

export async function httpGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",                     // ← importante
    headers: { "cache-control": "no-store", ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function httpPost<T>(path: string, body?: any, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",                     // ← importante
    headers: { "Content-Type": "application/json", "cache-control": "no-store", ...(init.headers ?? {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => ({} as T));
}
