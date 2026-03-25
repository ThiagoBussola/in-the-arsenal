import { API_UPSTREAM_ERROR } from "./fetch-errors";

/**
 * Browser: same-origin `/api` (proxied to Express) unless NEXT_PUBLIC_API_URL is set.
 * Server: NEXT_PUBLIC_API_SERVER_ORIGIN = backend base URL without /api (Railway Railpack
 * treats API_SERVER_URL as a build secret; use NEXT_PUBLIC_* so `next build` gets the value).
 */
function apiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  const origin = process.env.NEXT_PUBLIC_API_SERVER_ORIGIN?.trim() ?? "";
  if (origin) {
    const s = origin.replace(/\/$/, "");
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
