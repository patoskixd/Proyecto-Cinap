const API_BASE = "/api";

export class HttpError extends Error {
  constructor(public status: number, message: string, public detail?: any) {
    super(`HTTP ${status}: ${message}`);
    this.name = "HttpError";
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

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();

  const res = await fetch(buildUrl(path), {
    credentials: "include",
    cache: method === "GET" ? "default" : "no-store",
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let parsed: any;
    const ct = res.headers.get("content-type") || "";
    try {
      parsed = ct.includes("json") ? await res.clone().json() : await res.clone().text();
    } catch { /* noop */ }

    const msg =
      typeof parsed?.detail === "string"
        ? parsed.detail
        : parsed?.detail?.message ??
          parsed?.message ??
          res.statusText ??
          "Solicitud fallida";

    throw new HttpError(res.status, msg, parsed?.detail ?? parsed);
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


type GetOptions = RequestInit & {
  ttlMs?: number;   
  dedupe?: boolean; 
};

const __memCache = new Map<string, { exp: number; data: any }>();
const __inflight = new Map<string, Promise<any>>();

export const httpGetCached = <T>(path: string, opts: GetOptions = {}) => {
  const url = buildUrl(path);
  const now = Date.now();
  const ttl = opts.ttlMs ?? 0;
  const doCache = ttl > 0;

  if (doCache) {
    const c = __memCache.get(url);
    if (c && c.exp > now) return Promise.resolve(c.data as T);
  }

  const dedupe = opts.dedupe !== false;
  if (dedupe && __inflight.has(url)) return __inflight.get(url) as Promise<T>;

  const p = request<T>(path, { ...opts, method: "GET" })
    .then((res) => {
      if (doCache) __memCache.set(url, { exp: now + ttl, data: res });
      return res;
    })
    .finally(() => __inflight.delete(url));

  if (dedupe) __inflight.set(url, p as Promise<any>);
  return p;
};
