import { API_UPSTREAM_ERROR } from "./fetch-errors";

/**
 * Browser: same-origin `/api` (proxied to Express) unless NEXT_PUBLIC_API_URL is set.
 * Avoids shipping builds that default to localhost — fixes NetworkError in production.
 */
function apiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  const server =
    process.env.API_SERVER_URL?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    "";
  if (server) {
    const s = server.replace(/\/$/, "");
    return s.endsWith("/api") ? s : `${s}/api`;
  }

  return "http://127.0.0.1:3001/api";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const base = apiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new TypeError("Failed to fetch");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body.error === API_UPSTREAM_ERROR) {
      throw new Error(API_UPSTREAM_ERROR);
    }
    throw new Error(body.error || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}
