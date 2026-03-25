import { describe, it, assert } from "poku";
import {
  FabraryImportService,
  type FabraryResolveCard,
} from "../../src/services/FabraryImportService";
import { CardZone, DeckFormat } from "../../src/models";
import type { CardCache } from "../../src/models";
import { normalizeCardSearchName } from "../../src/services/CardService";
import {
  VICTOR_GOLDMANE_FABRARY_CLIPBOARD,
  VICTOR_EXPECTED_ARENA_LINES,
  VICTOR_EXPECTED_DECK_LINES,
} from "../fixtures/fabrary-victor-goldmane-clipboard";

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

/** Victor Goldmane is a Guardian hero (no Ice/Revered on type line in this mock). */
function createVictorClipboardMockResolver(): FabraryResolveCard {
  return async (name, pitch) => {
    const n = normalizeCardSearchName(name);
    const lower = n.toLowerCase();
    if (
      pitch === null &&
      (lower.includes("victor") || lower.includes("goldmane"))
    ) {
      return mockCard("hero-victor", n, null, ["Hero", "Guardian"]);
    }
    if (pitch === null) {
      return mockCard(`eq:${lower}`, n, null, ["Equipment", "Generic"]);
    }
    return mockCard(`deck:${lower}:${pitch}`, n, pitch, [
      "Action",
      "Attack",
      "Guardian",
    ]);
  };
}

describe("FaBrary Victor Goldmane CC clipboard", () => {
  const svcParse = new FabraryImportService(async () => null);

  it("parses metadata, 10 arena + 27 deck lines; unicode in card name ok", () => {
    const p = svcParse.parseClipboardText(VICTOR_GOLDMANE_FABRARY_CLIPBOARD);
    assert.strictEqual(p.deckName, "Goldhim Tunic");
    assert.strictEqual(p.heroName, "Victor Goldmane, High and Mighty");
    assert.strictEqual(p.format, DeckFormat.CC);
    assert.strictEqual(p.arenaLines.length, VICTOR_EXPECTED_ARENA_LINES);
    assert.strictEqual(p.deckLines.length, VICTOR_EXPECTED_DECK_LINES);

    const riches = p.deckLines.find((l) => l.name.includes("Riches"));
    assert.ok(riches);
    assert.strictEqual(riches!.quantity, 1);
    assert.strictEqual(riches!.pitch, "2");

    const cnc = p.deckLines.find((l) => l.name.includes("Command and Conquer"));
    assert.ok(cnc);
    assert.strictEqual(cnc!.quantity, 3);
  });

  it("importFromText full list with mock resolver", async () => {
    const svc = new FabraryImportService(createVictorClipboardMockResolver());
    const result = await svc.importFromText(VICTOR_GOLDMANE_FABRARY_CLIPBOARD);

    assert.strictEqual(result.unresolved.length, 0);
    const n = VICTOR_EXPECTED_ARENA_LINES + VICTOR_EXPECTED_DECK_LINES;
    assert.strictEqual(result.entries.length, n);

    const equip = result.entries.filter((e) => e.zone === CardZone.EQUIPMENT);
    const main = result.entries.filter((e) => e.zone === CardZone.MAIN);
    assert.strictEqual(equip.length, VICTOR_EXPECTED_ARENA_LINES);
    assert.strictEqual(main.length, VICTOR_EXPECTED_DECK_LINES);
  });
});
