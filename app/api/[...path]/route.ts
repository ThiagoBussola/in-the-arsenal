import { NextRequest, NextResponse } from "next/server";
import { API_UPSTREAM_ERROR } from "../../lib/fetch-errors";

/** Route handlers usam Node (fetch estável, body streams). Edge não é necessário aqui. */
export const runtime = "nodejs";

const EXPRESS_LOCAL = "http://127.0.0.1:3001";
const UPSTREAM_MS = 90_000;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** Encaminha /api/* para o Express. Lê NEXT_PUBLIC_API_SERVER_ORIGIN ou NEXT_PUBLIC_API_URL (sem /api no fim). */
function expressOrigin(req: NextRequest): string {
  const raw =
    process.env.NEXT_PUBLIC_API_SERVER_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "";

  if (!raw) return EXPRESS_LOCAL;

  let base = raw.replace(/\/$/, "");
  if (base.toLowerCase().endsWith("/api")) base = base.slice(0, -4);
  if (!base) return EXPRESS_LOCAL;

  let target: URL;
  try {
    target = /^https?:\/\//i.test(base) ? new URL(base) : new URL(`http://${base}`);
  } catch {
    return EXPRESS_LOCAL;
  }

  // Evita loop: .env com URL do próprio Next (porta 3000) → proxy chamava a si mesmo.
  try {
    const self = new URL(req.nextUrl.origin);
    const canon = (h: string) =>
      h === "localhost" || h === "::1" ? "127.0.0.1" : h;
    const port = (u: URL) => u.port || (u.protocol === "https:" ? "443" : "80");
    if (
      canon(target.hostname) === canon(self.hostname) &&
      port(target) === port(self) &&
      target.protocol === self.protocol
    ) {
      return EXPRESS_LOCAL;
    }
  } catch {
    return EXPRESS_LOCAL;
  }

  return target.origin;
}

function filterHeaders(h: Headers): Headers {
  const out = new Headers();
  h.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase())) out.set(k, v);
  });
  return out;
}

async function proxy(req: NextRequest, segments: string[]) {
  const path = segments.join("/");
  const url = `${expressOrigin(req)}/api/${path}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: filterHeaders(req.headers),
    redirect: "manual",
    signal: AbortSignal.timeout(UPSTREAM_MS),
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const n = e instanceof Error ? e.name : "";
    if (n === "TimeoutError" || n === "AbortError") {
      console.error("[api proxy] timeout", url);
      return NextResponse.json(
        { error: API_UPSTREAM_ERROR, detail: "upstream_timeout" },
        { status: 504 },
      );
    }
    console.error("[api proxy] fetch failed", url, e);
    return NextResponse.json({ error: API_UPSTREAM_ERROR }, { status: 502 });
  }

  return new NextResponse(await res.arrayBuffer(), {
    status: res.status,
    statusText: res.statusText,
    headers: filterHeaders(res.headers),
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
