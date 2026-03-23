import { describe, it, assert } from "poku";
import app from "../../src/app";
import http from "http";

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: object,
  headers?: Record<string, string>
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const data = body ? JSON.stringify(body) : undefined;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...(data ? { "Content-Length": Buffer.byteLength(data).toString() } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk: Buffer) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode!, body: raw ? JSON.parse(raw) : null });
          } catch {
            resolve({ status: res.statusCode!, body: raw });
          }
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const server = app.listen(0);

describe("User Routes — Integration Tests", async () => {
  await it("GET /health should return ok", async () => {
    const res = await request(server, "GET", "/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, "ok");
  });

  await it("POST /api/auth/register should validate input", async () => {
    const res = await request(server, "POST", "/api/auth/register", {
      name: "",
      email: "not-an-email",
      password: "short",
    });
    assert.strictEqual(res.status, 422);
    assert.strictEqual(res.body.error, "Validation failed");
    assert.ok(Array.isArray(res.body.details), "Should have validation details");
  });

  await it("POST /api/auth/login should reject invalid credentials format", async () => {
    const res = await request(server, "POST", "/api/auth/login", {
      email: "",
      password: "",
    });
    assert.strictEqual(res.status, 422);
  });

  await it("GET /api/auth/me should require authentication", async () => {
    const res = await request(server, "GET", "/api/auth/me");
    assert.strictEqual(res.status, 401);
  });

  await it("POST /api/posts should require authentication", async () => {
    const res = await request(server, "POST", "/api/posts", {
      title: "Test Post",
      slug: "test-post",
      content: "Hello world",
    });
    assert.strictEqual(res.status, 401);
  });

  server.close();
});
