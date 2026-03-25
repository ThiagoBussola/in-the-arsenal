import { describe, it, assert } from "poku";
import { DeckValidationService } from "../../src/services/DeckValidationService";
import { DeckFormat, CardZone } from "../../src/models";
import { buildCard } from "../helpers/card-fixtures";

const v = new DeckValidationService();

/** Victor Goldmane: Guardian CC, no Ice/Revered grants on this test hero. */
function victorHero() {
  return buildCard({
    uniqueId: "test_victor_goldman_cc",
    name: "Victor Goldmane, High and Mighty",
    types: ["Hero", "Guardian"],
    ccLegal: true,
  });
}

/** Jarl: Guardian + Ice/Earth from HERO_TEXT_GRANTED_TALENTS (test_jarl_vetreidi). */
function jarlHero() {
  return buildCard({
    uniqueId: "test_jarl_vetreidi",
    name: "Jarl Vetreiði",
    types: ["Hero", "Guardian"],
    ccLegal: true,
  });
}

/** Pleiades-style: Guardian + Revered on keywords. */
function pleiadesHero() {
  return buildCard({
    uniqueId: "test_pleiades_revered",
    name: "Pleiades, Superstar",
    types: ["Hero", "Guardian"],
    cardKeywords: ["Revered"],
    ccLegal: true,
  });
}

/** Young Dorinthea for SAGE: Warrior + Light. */
function dorintheaYoungSage() {
  return buildCard({
    uniqueId: "test_dorinthea_young_sage",
    name: "Dorinthea Ironsong",
    types: ["Hero", "Young", "Warrior"],
    cardKeywords: ["Light"],
    sageLegal: true,
  });
}

describe("Deck validation — Victor (CC, no specializations)", () => {
  it("allows Guardian attacks and Generic", () => {
    const hero = victorHero();
    const strike = buildCard({
      uniqueId: "w-strike",
      name: "Steel Edge",
      types: ["Action", "Attack", "Guardian"],
      ccLegal: true,
    });
    const gen = buildCard({
      uniqueId: "g1",
      name: "Scar for a Scar",
      types: ["Action", "Attack", "Generic"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: strike, quantity: 1, zone: CardZone.MAIN },
      { card: gen, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(!e.some((x) => x.code === "CLASS_MISMATCH" || x.code === "TALENT_MISMATCH"));
  });

  it("rejects Ice on class-matched Guardian card (talent Jarl has, Victor does not)", () => {
    const hero = victorHero();
    const iceGuardian = buildCard({
      uniqueId: "ice-w",
      name: "Hypothetical Ice Guardian Attack",
      types: ["Action", "Attack", "Ice", "Guardian"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: iceGuardian, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TALENT_MISMATCH"));
  });

  it("rejects Revered on same-class Guardian card (Pleiades talent, not Victor’s)", () => {
    const hero = victorHero();
    const revGuardian = buildCard({
      uniqueId: "rev-w",
      name: "Hypothetical Revered Guardian Attack",
      types: ["Action", "Attack", "Guardian"],
      cardKeywords: ["Revered"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: revGuardian, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TALENT_MISMATCH"));
  });

  it("rejects wrong class even without extra talents (Warrior vs Victor Guardian)", () => {
    const hero = victorHero();
    const warriorAtk = buildCard({
      uniqueId: "g-atk",
      name: "Warrior Bash",
      types: ["Action", "Attack", "Warrior"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: warriorAtk, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "CLASS_MISMATCH"));
  });

  it("rejects wrong class (Ninja)", () => {
    const hero = victorHero();
    const ninja = buildCard({
      uniqueId: "nj1",
      name: "Deadly Duo",
      types: ["Action", "Attack", "Ninja"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: ninja, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "CLASS_MISMATCH"));
  });
});

describe("Deck validation — Jarl (CC, Ice+Earth text grants)", () => {
  it("allows Ice Guardian attack", () => {
    const hero = jarlHero();
    const ice = buildCard({
      uniqueId: "ff",
      name: "Frost Fang",
      types: ["Action", "Attack", "Ice", "Guardian"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: ice, quantity: 3, zone: CardZone.MAIN },
    ]);
    assert.ok(!e.some((x) => x.code === "TALENT_MISMATCH" || x.code === "CLASS_MISMATCH"));
  });

  it("allows Earth-relevant Guardian card with earth talent on card", () => {
    const hero = jarlHero();
    const earth = buildCard({
      uniqueId: "oak",
      name: "Oaken Old",
      types: ["Action", "Guardian"],
      cardKeywords: ["Earth"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: earth, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(!e.some((x) => x.code === "TALENT_MISMATCH"));
  });

  it("rejects Ninja (wrong class)", () => {
    const hero = jarlHero();
    const ninja = buildCard({
      uniqueId: "n1",
      name: "Snatch",
      types: ["Action", "Attack", "Ninja"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: ninja, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "CLASS_MISMATCH"));
  });

  it("rejects Light Warrior card (talent not on Jarl)", () => {
    const hero = jarlHero();
    const boltynStyle = buildCard({
      uniqueId: "ltw",
      name: "Light the Way",
      types: ["Action", "Warrior"],
      cardKeywords: ["Light"],
      ccLegal: true,
    });
    const e = v.validate(DeckFormat.CC, hero, [
      { card: boltynStyle, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "CLASS_MISMATCH"));
  });
});

describe("Deck validation — Pleiades vs Victor/Jarl cards (CC)", () => {
  it("Pleiades allows Revered Guardian; Victor lacks class and talent", () => {
    const card = buildCard({
      uniqueId: "shared-rev",
      name: "Revered Strike",
      types: ["Action", "Attack", "Guardian"],
      cardKeywords: ["Revered"],
      ccLegal: true,
    });
    const ok = v.validate(DeckFormat.CC, pleiadesHero(), [
      { card, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(
      !ok.some(
        (x) =>
          x.code === "TALENT_MISMATCH" ||
          x.code === "CLASS_MISMATCH",
      ),
    );

    const bad = v.validate(DeckFormat.CC, victorHero(), [
      { card, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(
      bad.some(
        (x) =>
          x.code === "TALENT_MISMATCH" || x.code === "CLASS_MISMATCH",
      ),
    );
  });

  it("Pleiades rejects Ice Guardian; Jarl accepts", () => {
    const iceG = buildCard({
      uniqueId: "ice-shared",
      name: "Glacial Bash",
      types: ["Action", "Ice", "Guardian"],
      ccLegal: true,
    });
    const p = v.validate(DeckFormat.CC, pleiadesHero(), [
      { card: iceG, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(p.some((x) => x.code === "TALENT_MISMATCH"));

    const j = v.validate(DeckFormat.CC, jarlHero(), [
      { card: iceG, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(!j.some((x) => x.code === "TALENT_MISMATCH"));
  });
});

describe("Deck validation — Young Dorinthea SAGE", () => {
  it("allows Warrior + Light sage-legal card", () => {
    const hero = dorintheaYoungSage();
    const card = buildCard({
      uniqueId: "s-wl",
      name: "Ira, Scarlet Haze",
      types: ["Action", "Attack", "Warrior"],
      cardKeywords: ["Light"],
      sageLegal: true,
      rarities: ["Common", "C"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card, quantity: 2, zone: CardZone.MAIN },
    ]);
    assert.ok(!e.some((x) => x.code === "CLASS_MISMATCH" || x.code === "TALENT_MISMATCH"));
    assert.ok(!e.some((x) => x.code === "TOO_MANY_COPIES"));
  });

  it("rejects 3 copies of non-legendary (SAGE max 2)", () => {
    const hero = dorintheaYoungSage();
    const card = buildCard({
      uniqueId: "s-c",
      name: "Sage Filler",
      types: ["Action", "Attack", "Warrior"],
      cardKeywords: ["Light"],
      sageLegal: true,
      rarities: ["Rare", "R"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card, quantity: 3, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TOO_MANY_COPIES"));
  });

  it("rejects Ice card (no Ice talent on Dorinthea)", () => {
    const hero = dorintheaYoungSage();
    const ice = buildCard({
      uniqueId: "s-ice",
      name: "Frost Bite",
      types: ["Action", "Ice", "Warrior"],
      sageLegal: true,
      rarities: ["Common", "C"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card: ice, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TALENT_MISMATCH"));
  });

  it("rejects Revered card", () => {
    const hero = dorintheaYoungSage();
    const rev = buildCard({
      uniqueId: "s-rev",
      name: "Revered Thing",
      types: ["Action", "Warrior"],
      cardKeywords: ["Revered"],
      sageLegal: true,
      rarities: ["Common", "C"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card: rev, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TALENT_MISMATCH"));
  });

  it("rejects Wizard class card", () => {
    const hero = dorintheaYoungSage();
    const wiz = buildCard({
      uniqueId: "s-wiz",
      name: "Snapback",
      types: ["Action", "Wizard"],
      sageLegal: true,
      rarities: ["Common", "C"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card: wiz, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "CLASS_MISMATCH"));
  });

  it("rejects second Legendary (SAGE at most one)", () => {
    const hero = dorintheaYoungSage();
    const l1 = buildCard({
      uniqueId: "leg-a",
      name: "Legend A",
      types: ["Action", "Warrior"],
      cardKeywords: ["Light"],
      sageLegal: true,
      rarities: ["Legendary", "L"],
    });
    const l2 = buildCard({
      uniqueId: "leg-b",
      name: "Legend B",
      types: ["Action", "Warrior"],
      cardKeywords: ["Light"],
      sageLegal: true,
      rarities: ["L"],
    });
    const e = v.validate(DeckFormat.SAGE, hero, [
      { card: l1, quantity: 1, zone: CardZone.MAIN },
      { card: l2, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(e.some((x) => x.code === "TOO_MANY_LEGENDARIES"));
  });
});
