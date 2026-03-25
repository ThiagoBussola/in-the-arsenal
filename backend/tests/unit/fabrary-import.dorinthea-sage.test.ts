import { describe, it, assert } from "poku";
import {
  FabraryImportService,
  type FabraryResolveCard,
} from "../../src/services/FabraryImportService";
import { CardZone, DeckFormat } from "../../src/models";
import type { CardCache } from "../../src/models";
import { normalizeCardSearchName } from "../../src/services/CardService";
import {
  DORINTHEA_SAGE_FABRARY_CLIPBOARD,
  DORINTHEA_SAGE_EXPECTED_ARENA_LINES,
  DORINTHEA_SAGE_EXPECTED_DECK_LINES,
} from "../fixtures/fabrary-dorinthea-sage-clipboard";

function mockCard(
  uniqueId: string,
  name: string,
  pitch: string | null,
  types: string[],
): CardCache {
  const json = { uniqueId, name, pitch, types };
  return {
    uniqueId,
    name,
    pitch,
    types,
    toJSON: () => json,
  } as unknown as CardCache;
}

function createDorintheaSageMockResolver(): FabraryResolveCard {
  return async (name, pitch) => {
    const n = normalizeCardSearchName(name);
    const lower = n.toLowerCase();
    if (pitch === null && lower.includes("dorinthea")) {
      return mockCard("hero-dorinthea", n, null, [
        "Hero",
        "Young",
        "Warrior",
      ]);
    }
    if (pitch === null) {
      return mockCard(`eq:${lower}`, n, null, ["Equipment", "Generic"]);
    }
    return mockCard(`deck:${lower}:${pitch}`, n, pitch, [
      "Action",
      "Attack",
      "Warrior",
    ]);
  };
}

describe("FaBrary Dorinthea Silver Age (SAGE) clipboard", () => {
  const svcParse = new FabraryImportService(async () => null);

  it("parses Silver Age as SAGE, 7 arena + 22 deck lines", () => {
    const p = svcParse.parseClipboardText(DORINTHEA_SAGE_FABRARY_CLIPBOARD);
    assert.strictEqual(p.deckName, "Dorinthea PB");
    assert.strictEqual(p.heroName, "Dorinthea");
    assert.strictEqual(p.format, DeckFormat.SAGE);
    assert.strictEqual(p.arenaLines.length, DORINTHEA_SAGE_EXPECTED_ARENA_LINES);
    assert.strictEqual(p.deckLines.length, DORINTHEA_SAGE_EXPECTED_DECK_LINES);

    const scar = p.deckLines.find((l) => l.name.includes("Scar for a Scar"));
    assert.ok(scar);
    assert.strictEqual(scar!.quantity, 2);
    assert.strictEqual(scar!.pitch, "1");

    const hitYellow = p.deckLines.filter((l) => l.name.includes("Hit and Run"));
    assert.strictEqual(hitYellow.length, 2);
    const y = hitYellow.find((l) => l.pitch === "2");
    assert.ok(y);
    assert.strictEqual(y!.quantity, 2);
  });

  it("importFromText full pipeline with mock resolver", async () => {
    const svc = new FabraryImportService(createDorintheaSageMockResolver());
    const result = await svc.importFromText(DORINTHEA_SAGE_FABRARY_CLIPBOARD);

    assert.strictEqual(result.unresolved.length, 0);
    const n = DORINTHEA_SAGE_EXPECTED_ARENA_LINES + DORINTHEA_SAGE_EXPECTED_DECK_LINES;
    assert.strictEqual(result.entries.length, n);

    const equip = result.entries.filter((e) => e.zone === CardZone.EQUIPMENT);
    const main = result.entries.filter((e) => e.zone === CardZone.MAIN);
    assert.strictEqual(equip.length, DORINTHEA_SAGE_EXPECTED_ARENA_LINES);
    assert.strictEqual(main.length, DORINTHEA_SAGE_EXPECTED_DECK_LINES);
  });
});
