import { describe, it, assert } from "poku";
import { FabraryImportService } from "../../src/services/FabraryImportService";
import { DeckFormat } from "../../src/models";

const svc = new FabraryImportService();

const SAMPLE = `Name: Test Deck (Copy)
Hero: Pleiades, Superstar
Format: Classic Constructed

Arena cards
1x Arcane Lantern
2x Steelblade Equipment (red)

Deck cards
3x Command and Conquer (red)
1x Oasis Respite (yellow)
2x Cranial Crush (blue)

Feito com o ❤️ na FaBrary
`;

describe("FabraryImportService — parser unit tests", () => {
  it("extracts name, hero, format", () => {
    const p = svc.parseClipboardText(SAMPLE);
    assert.strictEqual(p.deckName, "Test Deck (Copy)");
    assert.strictEqual(p.heroName, "Pleiades, Superstar");
    assert.strictEqual(p.format, DeckFormat.CC);
  });

  it("parses arena and deck lines with pitch from color", () => {
    const p = svc.parseClipboardText(SAMPLE);
    assert.strictEqual(p.arenaLines.length, 2);
    assert.strictEqual(p.deckLines.length, 3);

    const lantern = p.arenaLines.find((l) => l.name.includes("Arcane"));
    assert.ok(lantern);
    assert.strictEqual(lantern!.quantity, 1);
    assert.strictEqual(lantern!.pitch, null);

    const cnc = p.deckLines.find((l) => l.name.includes("Command"));
    assert.ok(cnc);
    assert.strictEqual(cnc!.quantity, 3);
    assert.strictEqual(cnc!.pitch, "1");

    const oasis = p.deckLines.find((l) => l.name.includes("Oasis"));
    assert.strictEqual(oasis!.pitch, "2");

    const cranial = p.deckLines.find((l) => l.name.includes("Cranial"));
    assert.strictEqual(cranial!.pitch, "3");
  });

  it("maps SAGE format labels", () => {
    const p = svc.parseClipboardText("Format: SAGE\n\nDeck cards\n1x Foo (red)\n");
    assert.strictEqual(p.format, DeckFormat.SAGE);
  });
});
