import { NextRequest, NextResponse } from "next/server";
import { API_UPSTREAM_ERROR } from "../../lib/fetch-errors";

export const runtime = "nodejs";

/**
 * Proxies /api/* to the Express backend. Set NEXT_PUBLIC_API_SERVER_ORIGIN on the Next
 * service (e.g. https://api.example.com) — no /api suffix. Use NEXT_PUBLIC_* so Railpack
 * does not require a missing BuildKit "secret" for API_SERVER_URL.
 */
function backendOrigin(): string {
  const primary = process.env.NEXT_PUBLIC_API_SERVER_ORIGIN?.trim() ?? "";
  if (primary) {
    let u = primary.replace(/\/$/, "");
    if (u.endsWith("/api")) u = u.slice(0, -4);
    return u;
  }

  const fallback = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (fallback) {
    let u = fallback.replace(/\/$/, "");
    if (u.endsWith("/api")) u = u.slice(0, -4);
    if (u && !u.includes("localhost") && !u.includes("127.0.0.1")) return u;
  }

  return "http://127.0.0.1:3001";
}

function targetUrl(segments: string[], search: string): string {
  const path = segments.join("/");
  return `${backendOrigin()}/api/${path}${search}`;
}

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

function forwardRequestHeaders(req: NextRequest): Headers {
  const out = new Headers();
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

function forwardResponseHeaders(res: Response): Headers {
  const out = new Headers();
  res.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

async function handle(req: NextRequest, segments: string[]) {
  const url = targetUrl(segments, req.nextUrl.search);
  const headers = forwardRequestHeaders(req);
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    console.error("[api proxy] upstream fetch failed", { url, err });
    return NextResponse.json(
      { error: API_UPSTREAM_ERROR },
      { status: 502 },
    );
  }

  const body = await res.arrayBuffer();
  return new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
    headers: forwardResponseHeaders(res),
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path ?? []);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path ?? []);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path ?? []);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path ?? []);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
