import { describe, it, assert } from "poku";
import {
  FabraryImportService,
  type FabraryResolveCard,
} from "../../src/services/FabraryImportService";
import { CardZone, DeckFormat } from "../../src/models";
import type { CardCache } from "../../src/models";
import { normalizeCardSearchName } from "../../src/services/CardService";
import {
  JARL_VETREIDI_FABRARY_CLIPBOARD,
  JARL_EXPECTED_ARENA_LINES,
  JARL_EXPECTED_DECK_LINES,
} from "../fixtures/fabrary-jarl-vetreidi-clipboard";

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

function createJarlClipboardMockResolver(): FabraryResolveCard {
  return async (name, pitch) => {
    const n = normalizeCardSearchName(name);
    const lower = n.toLowerCase();
    if (pitch === null && lower.includes("jarl")) {
      return mockCard("hero-jarl", n, null, ["Hero", "Guardian"]);
    }
    if (pitch === null) {
      return mockCard(`eq:${lower}`, n, null, ["Equipment", "Generic"]);
    }
    return mockCard(`deck:${lower}:${pitch}`, n, pitch, ["Action", "Attack", "Guardian"]);
  };
}

describe("FaBrary Jarl Vetreiði clipboard", () => {
  const svcParse = new FabraryImportService(async () => null);

  it("parses metadata, 12 arena + 37 deck lines, stops at footer", () => {
    const p = svcParse.parseClipboardText(JARL_VETREIDI_FABRARY_CLIPBOARD);
    assert.strictEqual(p.deckName, "Jarl Proxy");
    assert.strictEqual(p.heroName, "Jarl Vetreiði");
    assert.strictEqual(p.format, DeckFormat.CC);
    assert.strictEqual(p.arenaLines.length, JARL_EXPECTED_ARENA_LINES);
    assert.strictEqual(p.deckLines.length, JARL_EXPECTED_DECK_LINES);

    const frost = p.deckLines.find((l) => l.name.includes("Frost Fang"));
    assert.ok(frost);
    assert.strictEqual(frost!.quantity, 3);
    assert.strictEqual(frost!.pitch, "1");

    const channel = p.deckLines.find((l) => l.name.includes("Channel Lake Frigid"));
    assert.ok(channel);
    assert.strictEqual(channel!.pitch, "3");
  });

  it("importFromText resolves full list with working resolver (regression: not 1 card)", async () => {
    const svc = new FabraryImportService(createJarlClipboardMockResolver());
    const result = await svc.importFromText(JARL_VETREIDI_FABRARY_CLIPBOARD);

    assert.strictEqual(result.unresolved.length, 0);
    const expected = JARL_EXPECTED_ARENA_LINES + JARL_EXPECTED_DECK_LINES;
    assert.strictEqual(result.entries.length, expected);

    const equip = result.entries.filter((e) => e.zone === CardZone.EQUIPMENT);
    const main = result.entries.filter((e) => e.zone === CardZone.MAIN);
    assert.strictEqual(equip.length, JARL_EXPECTED_ARENA_LINES);
    assert.strictEqual(main.length, JARL_EXPECTED_DECK_LINES);
  });
});
