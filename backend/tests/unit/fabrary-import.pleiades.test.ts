import { describe, it, assert } from "poku";
import {
  FabraryImportService,
  type FabraryResolveCard,
} from "../../src/services/FabraryImportService";
import { CardZone, DeckFormat } from "../../src/models";
import type { CardCache } from "../../src/models";
import { normalizeCardSearchName } from "../../src/services/CardService";
import {
  PLEIADES_FABRARY_CLIPBOARD,
  PLEIADES_EXPECTED_ARENA_LINES,
  PLEIADES_EXPECTED_DECK_LINES,
} from "../fixtures/fabrary-pleiades-clipboard";

function mockCard(
  uniqueId: string,
  name: string,
  pitch: string | null,
  types: string[],
  typeText: string | null = null,
): CardCache {
  const json = { uniqueId, name, pitch, types, typeText };
  return {
    uniqueId,
    name,
    pitch,
    types,
    typeText,
    toJSON: () => json,
  } as unknown as CardCache;
}

/** Simulates a full card DB: every clipboard line resolves to a distinct printing. */
function createPleiadesMockResolver(): FabraryResolveCard {
  return async (name, pitch) => {
    const n = normalizeCardSearchName(name);
    const lower = n.toLowerCase();
    if (pitch === null && lower.includes("pleiades")) {
      return mockCard("hero-pleiades", n, null, ["Hero", "Guardian"]);
    }
    if (pitch === null && lower.includes("miller")) {
      return mockCard(
        "weapon-miller",
        n,
        null,
        ["Weapon", "Guardian"],
        "Guardian Weapon — Hammer (1H)",
      );
    }
    if (pitch === null && lower.includes("sledge")) {
      return mockCard(
        "weapon-sledge",
        n,
        null,
        ["Weapon", "Guardian"],
        "Guardian Weapon — Hammer (2H)",
      );
    }
    if (pitch === null && lower.includes("rampart")) {
      return mockCard(
        "eq-rampart",
        n,
        null,
        ["Equipment", "Guardian", "Off-Hand"],
        "Guardian Equipment — Off-Hand",
      );
    }
    if (pitch === null) {
      return mockCard(`eq:${lower}`, n, null, ["Equipment", "Generic"]);
    }
    return mockCard(`deck:${lower}:${pitch}`, n, pitch, ["Action", "Attack"]);
  };
}

describe("FaBrary Pleiades clipboard — parser + full import (mock resolver)", () => {
  const svcParseOnly = new FabraryImportService(async () => null);

  it("parses all arena and deck lines; stops before footer URL", () => {
    const p = svcParseOnly.parseClipboardText(PLEIADES_FABRARY_CLIPBOARD);
    assert.strictEqual(p.deckName, "YMBTTTR COPE Pleiades (Copy)");
    assert.strictEqual(p.heroName, "Pleiades, Superstar");
    assert.strictEqual(p.format, DeckFormat.CC);
    assert.strictEqual(p.arenaLines.length, PLEIADES_EXPECTED_ARENA_LINES);
    assert.strictEqual(p.deckLines.length, PLEIADES_EXPECTED_DECK_LINES);

    const palm = p.deckLines.find((l) => l.name.includes("In the Palm"));
    assert.ok(palm);
    assert.strictEqual(palm!.quantity, 3);
    assert.strictEqual(palm!.pitch, "1");

    const continued = p.deckLines.find((l) => l.name.includes("To Be Continued"));
    assert.ok(continued);
    assert.strictEqual(continued!.quantity, 1);
    assert.strictEqual(continued!.pitch, "3");

    const fyendal = p.arenaLines.find((l) => l.name.includes("Fyendal"));
    assert.ok(fyendal);
    assert.strictEqual(fyendal!.pitch, null);
  });

  it("importFromText yields one entry per line + hero; zero unresolved when resolver works", async () => {
    const svc = new FabraryImportService(createPleiadesMockResolver());
    const result = await svc.importFromText(PLEIADES_FABRARY_CLIPBOARD);

    assert.strictEqual(result.unresolved.length, 0);
    assert.ok(result.heroCard);
    assert.strictEqual(result.format, DeckFormat.CC);

    const expectedEntries =
      PLEIADES_EXPECTED_ARENA_LINES + PLEIADES_EXPECTED_DECK_LINES;
    assert.strictEqual(
      result.entries.length,
      expectedEntries,
      "every arena + deck line must become an entry (this is what broke when only one card resolved)",
    );

    const nArena = PLEIADES_EXPECTED_ARENA_LINES;
    const arenaPortion = result.entries.slice(0, nArena);
    const mainEntries = result.entries.slice(nArena);
    assert.strictEqual(mainEntries.length, PLEIADES_EXPECTED_DECK_LINES);

    const sledge = arenaPortion.find((e) =>
      String(e.card.name).toLowerCase().includes("sledge"),
    );
    assert.ok(sledge);
    assert.strictEqual(
      sledge!.zone,
      CardZone.SIDEBOARD,
      "2H weapon must leave arena when 1H + off-hand are present (FaBrary export has no side marker)",
    );

    const miller = arenaPortion.find((e) =>
      String(e.card.name).toLowerCase().includes("miller"),
    );
    assert.ok(miller);
    assert.strictEqual(miller!.zone, CardZone.WEAPON);

    const rampart = arenaPortion.find((e) =>
      String(e.card.name).toLowerCase().includes("rampart"),
    );
    assert.ok(rampart);
    assert.strictEqual(rampart!.zone, CardZone.EQUIPMENT);

    const palmEntry = result.entries.find((e) =>
      String(e.card.name).includes("In the Palm"),
    );
    assert.ok(palmEntry);
    assert.strictEqual(palmEntry!.quantity, 3);
    assert.strictEqual(palmEntry!.zone, CardZone.MAIN);

    const smash = result.entries.filter((e) =>
      String(e.card.name).toLowerCase().includes("tough smashup"),
    );
    assert.strictEqual(smash.length, 3);
    assert.strictEqual(new Set(smash.map((e) => e.uniqueId)).size, 3);
  });
});
