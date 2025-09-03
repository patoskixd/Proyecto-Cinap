const API_BASE = "/api";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
  }
}

function buildUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  await res.text().catch(() => "");
  return {} as T;
}

async function safeMessage(res: Response) {
  try {
    const j = await res.clone().json();
    return j?.detail ?? JSON.stringify(j);
  } catch {
    try { return await res.text(); } catch { return ""; }
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(buildUrl(path), {
    credentials: "include",        
    cache: "no-store",
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    throw new HttpError(res.status, await safeMessage(res));
  }
  return parseBody<T>(res);
}

export const httpGet = <T>(path: string, init: RequestInit = {}) =>
  request<T>(path, { ...init, method: "GET" });

export const httpPost = <T = unknown>(path: string, body?: any, init: RequestInit = {}) =>
  request<T>(path, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const httpPut = <T = unknown>(path: string, body?: any, init: RequestInit = {}) =>
  request<T>(path, {
    ...init,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const httpPatch = <T = unknown>(path: string, body?: any, init: RequestInit = {}) =>
  request<T>(path, {
    ...init,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const httpDelete = <T = unknown>(path: string, init: RequestInit = {}) =>
  request<T>(path, { ...init, method: "DELETE" });
