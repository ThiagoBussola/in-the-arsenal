import { describe, it, assert } from "poku";
import jwt from "jsonwebtoken";

describe("AuthService — Unit Tests", () => {
  const JWT_SECRET = "test-secret-that-is-long-enough";

  it("should generate a valid JWT token", () => {
    const payload = { userId: "abc-123", email: "hero@rathe.com", role: "USER" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

    assert.ok(token, "Token should be generated");
    assert.strictEqual(typeof token, "string");

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert.strictEqual(decoded.userId, "abc-123");
    assert.strictEqual(decoded.email, "hero@rathe.com");
    assert.strictEqual(decoded.role, "USER");
  });

  it("should reject a token with wrong secret", () => {
    const token = jwt.sign({ userId: "abc" }, JWT_SECRET);

    try {
      jwt.verify(token, "wrong-secret");
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.strictEqual(err.name, "JsonWebTokenError");
    }
  });

  it("should reject an expired token", () => {
    const token = jwt.sign({ userId: "abc" }, JWT_SECRET, { expiresIn: "0s" });

    // Small delay to ensure expiry
    try {
      jwt.verify(token, JWT_SECRET);
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.strictEqual(err.name, "TokenExpiredError");
    }
  });

  it("should hash password with bcrypt", async () => {
    const bcrypt = await import("bcrypt");
    const plain = "SwordOfRathe!42";
    const hash = await bcrypt.hash(plain, 12);

    assert.notStrictEqual(hash, plain, "Hash should differ from plain");
    assert.ok(hash.startsWith("$2b$"), "Should be a bcrypt hash");

    const valid = await bcrypt.compare(plain, hash);
    assert.ok(valid, "Should verify correct password");

    const invalid = await bcrypt.compare("wrong-password", hash);
    assert.ok(!invalid, "Should reject wrong password");
  });
});
