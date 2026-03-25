import { describe, it, assert } from "poku";
import { createPostSchema } from "../../src/schemas/post.schema";

describe("post.schema — Zod unit tests", () => {
  it("accepts valid create post payload", () => {
    const parsed = createPostSchema.parse({
      title: "Valid title",
      slug: "valid-slug-here",
      content: "Body",
      status: "DRAFT",
    });
    assert.strictEqual(parsed.title, "Valid title");
    assert.strictEqual(parsed.status, "DRAFT");
  });

  it("rejects invalid slug", () => {
    try {
      createPostSchema.parse({
        title: "T",
        slug: "Bad Slug",
        content: "x",
      });
      assert.fail("expected ZodError");
    } catch (e: any) {
      assert.ok(e?.name === "ZodError" || e?.issues);
    }
  });

  it("rejects short title", () => {
    try {
      createPostSchema.parse({
        title: "ab",
        slug: "ok-slug",
        content: "x",
      });
      assert.fail("expected ZodError");
    } catch (e: any) {
      assert.ok(e?.issues?.length > 0);
    }
  });
});
