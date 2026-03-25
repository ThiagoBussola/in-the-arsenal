import "../test-env";
import { sequelize } from "../../src/config/database";
import app from "../../src/app";
import { describe, it, assert } from "poku";
import http from "http";
import { Op } from "sequelize";
import { CardCache, User } from "../../src/models";
import { request } from "../helpers/http";

const CARD_IDS = {
  adultHero: "ita-int-adult",
  headEq: "ita-int-head",
  redSwing: "ita-int-swing",
} as const;

async function seedTestCards(): Promise<void> {
  await CardCache.destroy({
    where: { uniqueId: { [Op.in]: Object.values(CARD_IDS) } },
  });

  const now = new Date();
  const base = {
    color: null as string | null,
    cost: null as string | null,
    power: null as string | null,
    defense: null as string | null,
    health: null as string | null,
    cardKeywords: [] as string[],
    functionalText: null as string | null,
    typeText: "Test",
    imageUrl: null as string | null,
    ccBanned: false,
    blitzBanned: false,
    commonerBanned: false,
    llBanned: false,
    sageBanned: false,
    cachedAt: now,
  };

  await CardCache.bulkCreate([
    {
      ...base,
      uniqueId: CARD_IDS.adultHero,
      name: "ITA Adult Hero Display",
      types: ["Hero", "Warrior"],
      pitch: "2",
      ccLegal: true,
      blitzLegal: true,
      commonerLegal: false,
      llLegal: true,
      sageLegal: false,
      rarities: [],
    },
    {
      ...base,
      uniqueId: CARD_IDS.headEq,
      name: "ITA Head EQ",
      types: ["Equipment", "Generic", "Head"],
      pitch: null,
      ccLegal: true,
      blitzLegal: true,
      commonerLegal: true,
      llLegal: true,
      sageLegal: false,
      rarities: ["Common", "C"],
    },
    {
      ...base,
      uniqueId: CARD_IDS.redSwing,
      name: "ITA Red Swing Card",
      types: ["Action", "Attack", "Warrior"],
      pitch: "1",
      ccLegal: true,
      blitzLegal: true,
      commonerLegal: true,
      llLegal: true,
      sageLegal: false,
      rarities: ["Rare", "R"],
    },
  ] as any);
}

async function cleanupTestCards(): Promise<void> {
  await CardCache.destroy({
    where: { uniqueId: { [Op.in]: Object.values(CARD_IDS) } },
  });
}

function closeServer(s: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    s.close((err) => (err ? reject(err) : resolve()));
  });
}

const server = app.listen(0);
const email = `integration-${Date.now()}@ita.test`;
let accessToken = "";
let userId = "";
let postId = "";
let postSlug = "";
let deckId = "";

describe("API — Integration (auth, posts, decks, cards, fabrary)", async () => {
  await it("database is reachable", async () => {
    await sequelize.authenticate();
  });

  await it("seeds card_cache rows for integration", async () => {
    await seedTestCards();
  });

  await it("GET /health returns ok", async () => {
    const res = await request(server, "GET", "/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual((res.body as any).status, "ok");
  });

  await it("POST /api/auth/register creates user", async () => {
    const res = await request(server, "POST", "/api/auth/register", {
      name: "Integration Tester",
      email,
      password: "password123",
    });
    assert.strictEqual(res.status, 201);
    const body = res.body as any;
    assert.ok(body.accessToken);
    assert.ok(body.user?.id);
    accessToken = body.accessToken;
    userId = body.user.id;
  });

  await it("GET /api/auth/me returns user with Bearer token", async () => {
    const res = await request(server, "GET", "/api/auth/me", undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual((res.body as any).user?.email, email);
  });

  await it("POST /api/posts creates draft", async () => {
    postSlug = `integration-post-${Date.now()}`;
    const res = await request(
      server,
      "POST",
      "/api/posts",
      {
        title: "Integration Post",
        slug: postSlug,
        content: "# Hello\n\nBody",
        status: "DRAFT",
      },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 201);
    postId = (res.body as any).id;
    assert.ok(postId);
  });

  await it("PATCH /api/posts/:id publishes post", async () => {
    const res = await request(
      server,
      "PATCH",
      `/api/posts/${postId}`,
      { status: "PUBLISHED" },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual((res.body as any).status, "PUBLISHED");
  });

  await it("GET /api/posts lists published posts", async () => {
    const res = await request(
      server,
      "GET",
      `/api/posts?status=PUBLISHED&limit=5`,
      undefined,
      {}
    );
    assert.strictEqual(res.status, 200);
    const body = res.body as any;
    assert.ok(Array.isArray(body.rows));
    assert.ok(body.rows.some((p: any) => p.id === postId));
  });

  await it("GET /api/posts/slug/:slug returns post", async () => {
    const res = await request(
      server,
      "GET",
      `/api/posts/slug/${postSlug}`,
      undefined,
      {}
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual((res.body as any).id, postId);
  });

  await it("GET /api/cards/search finds seeded card (cache)", async () => {
    const res = await request(
      server,
      "GET",
      "/api/cards/search?q=ITA+Red&limit=10",
      undefined,
      {}
    );
    assert.strictEqual(res.status, 200);
    const body = res.body as any;
    assert.ok(body.cards?.some((c: any) => c.uniqueId === CARD_IDS.redSwing));
  });

  await it("POST /api/decks creates deck with hero", async () => {
    const slug = `integration-deck-${Date.now()}`;
    const res = await request(
      server,
      "POST",
      "/api/decks",
      {
        name: "Integration Deck",
        slug,
        format: "CC",
        visibility: "PRIVATE",
        heroCardId: CARD_IDS.adultHero,
      },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 201);
    deckId = (res.body as any).id;
    assert.ok(deckId);
  });

  await it("POST /api/decks/:id/cards adds main-deck card", async () => {
    const res = await request(
      server,
      "POST",
      `/api/decks/${deckId}/cards`,
      {
        cardUniqueId: CARD_IDS.redSwing,
        quantity: 3,
        zone: "MAIN",
      },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 201);
  });

  await it("GET /api/decks/:id/validate returns validation payload", async () => {
    const res = await request(
      server,
      "GET",
      `/api/decks/${deckId}/validate`,
      undefined,
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 200);
    const body = res.body as any;
    assert.strictEqual(typeof body.valid, "boolean");
    assert.ok(Array.isArray(body.errors));
    assert.ok(
      body.errors.some((e: any) => e.code === "DECK_TOO_SMALL"),
      "CC deck with 3 cards should warn small main deck"
    );
  });

  await it("PUT /api/decks/:id/cards replaces cards including equipment", async () => {
    const res = await request(
      server,
      "PUT",
      `/api/decks/${deckId}/cards`,
      {
        cards: [
          {
            cardUniqueId: CARD_IDS.redSwing,
            quantity: 3,
            zone: "MAIN",
          },
          {
            cardUniqueId: CARD_IDS.headEq,
            quantity: 1,
            zone: "EQUIPMENT",
          },
        ],
      },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 200);
  });

  await it("PATCH /api/decks/:id updates metadata", async () => {
    const res = await request(
      server,
      "PATCH",
      `/api/decks/${deckId}`,
      { description: "Updated via integration test" },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual((res.body as any).description, "Updated via integration test");
  });

  await it("POST /api/decks/import/fabrary resolves clipboard text", async () => {
    const raw = `Name: Imported (Copy)
Hero: ITA Adult Hero Display
Format: Classic Constructed

Arena cards
1x ITA Head EQ

Deck cards
2x ITA Red Swing Card (red)
`;
    const res = await request(
      server,
      "POST",
      "/api/decks/import/fabrary",
      { raw },
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 200);
    const body = res.body as any;
    assert.strictEqual(body.format, "CC");
    assert.ok(body.heroCard);
    assert.strictEqual(body.entries?.length, 2);
    assert.strictEqual(body.unresolved?.length, 0);
  });

  await it("GET /api/decks lists user decks", async () => {
    const res = await request(server, "GET", "/api/decks?page=1&limit=10", undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
    assert.strictEqual(res.status, 200);
    const body = res.body as any;
    assert.ok(body.rows?.some((d: any) => d.id === deckId));
  });

  await it("DELETE /api/decks/:id removes deck", async () => {
    const res = await request(
      server,
      "DELETE",
      `/api/decks/${deckId}`,
      undefined,
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 204);
  });

  await it("DELETE /api/posts/:id removes post", async () => {
    const res = await request(
      server,
      "DELETE",
      `/api/posts/${postId}`,
      undefined,
      { Authorization: `Bearer ${accessToken}` }
    );
    assert.strictEqual(res.status, 204);
  });

  await it("cleanup test user and card fixtures", async () => {
    await User.destroy({ where: { id: userId } });
    await cleanupTestCards();
  });

  await closeServer(server);
  await sequelize.close();
});
