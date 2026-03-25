import { describe, it, assert } from "poku";
import {
  createDeckSchema,
  addCardSchema,
  fabraryImportSchema,
} from "../../src/schemas/deck.schema";

describe("deck.schema — Zod unit tests", () => {
  it("createDeckSchema accepts SAGE format", () => {
    const d = createDeckSchema.parse({
      name: "My deck",
      slug: "my-deck-slug",
      format: "SAGE",
      visibility: "PUBLIC",
    });
    assert.strictEqual(d.format, "SAGE");
  });

  it("addCardSchema clamps zone enum", () => {
    const c = addCardSchema.parse({
      cardUniqueId: "abc123",
      quantity: 2,
      zone: "EQUIPMENT",
    });
    assert.strictEqual(c.zone, "EQUIPMENT");
  });

  it("fabraryImportSchema requires raw text", () => {
    const r = fabraryImportSchema.parse({ raw: "Name: X\n" });
    assert.ok(r.raw.length > 0);
  });
});
