import { describe, it, assert } from "poku";
import { DeckValidationService } from "../../src/services/DeckValidationService";
import { DeckFormat, CardZone } from "../../src/models";
import { buildCard } from "../helpers/card-fixtures";

const v = new DeckValidationService();

describe("DeckValidationService — Unit Tests", () => {
  it("CC: rejects missing hero", () => {
    const errors = v.validate(DeckFormat.CC, null, []);
    assert.ok(errors.some((e) => e.code === "NO_HERO"));
  });

  it("CC: rejects Young hero", () => {
    const hero = buildCard({
      uniqueId: "h1",
      name: "Young Briar",
      types: ["Hero", "Young", "Warrior"],
      pitch: "2",
      ccLegal: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, []);
    assert.ok(errors.some((e) => e.code === "HERO_IS_YOUNG"));
  });

  it("CC: accepts adult hero", () => {
    const hero = buildCard({
      uniqueId: "h2",
      name: "Adult Hero",
      types: ["Hero", "Warrior"],
      pitch: "2",
      ccLegal: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, []);
    assert.ok(!errors.some((e) => e.code === "HERO_IS_YOUNG"));
    assert.ok(!errors.some((e) => e.code === "HERO_NOT_YOUNG"));
  });

  it("Blitz: requires Young hero", () => {
    const adult = buildCard({
      uniqueId: "h3",
      name: "Adult",
      types: ["Hero", "Warrior"],
      blitzLegal: true,
    });
    const young = buildCard({
      uniqueId: "h4",
      name: "Young",
      types: ["Hero", "Young", "Warrior"],
      blitzLegal: true,
    });

    const errAdult = v.validate(DeckFormat.BLITZ, adult, []);
    assert.ok(errAdult.some((e) => e.code === "HERO_NOT_YOUNG"));

    const errYoung = v.validate(DeckFormat.BLITZ, young, []);
    assert.ok(!errYoung.some((e) => e.code === "HERO_NOT_YOUNG"));
  });

  it("CC: flags banned card", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Hero",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const banned = buildCard({
      uniqueId: "c1",
      name: "Banned Strike",
      types: ["Action", "Attack", "Warrior"],
      ccLegal: true,
      ccBanned: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, [
      { card: banned, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "BANNED"));
  });

  it("CC: flags not legal", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Hero",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const illegal = buildCard({
      uniqueId: "c2",
      name: "Illegal",
      types: ["Action", "Attack", "Warrior"],
      ccLegal: false,
    });
    const errors = v.validate(DeckFormat.CC, hero, [
      { card: illegal, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "NOT_LEGAL"));
  });

  it("CC: too many copies of same name", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Hero",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const a = buildCard({
      uniqueId: "c3",
      name: "Same",
      types: ["Action", "Attack", "Warrior"],
      ccLegal: true,
    });
    const b = buildCard({
      uniqueId: "c4",
      name: "Same",
      types: ["Action", "Attack", "Warrior"],
      ccLegal: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, [
      { card: a, quantity: 2, zone: CardZone.MAIN },
      { card: b, quantity: 2, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "TOO_MANY_COPIES"));
  });

  it("SAGE: max 2 copies", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Young Sage",
      types: ["Hero", "Young", "Warrior"],
      sageLegal: true,
    });
    const card = buildCard({
      uniqueId: "s1",
      name: "Sage Attack",
      types: ["Action", "Attack", "Warrior"],
      sageLegal: true,
      rarities: ["Common", "C"],
    });
    const errors = v.validate(DeckFormat.SAGE, hero, [
      { card, quantity: 3, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "TOO_MANY_COPIES"));
  });

  it("SAGE: at most one legendary", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Young",
      types: ["Hero", "Young", "Warrior"],
      sageLegal: true,
    });
    const leg1 = buildCard({
      uniqueId: "l1",
      name: "Leg One",
      types: ["Action", "Warrior"],
      sageLegal: true,
      rarities: ["Legendary", "L"],
    });
    const leg2 = buildCard({
      uniqueId: "l2",
      name: "Leg Two",
      types: ["Action", "Warrior"],
      sageLegal: true,
      rarities: ["L"],
    });
    const errors = v.validate(DeckFormat.SAGE, hero, [
      { card: leg1, quantity: 1, zone: CardZone.MAIN },
      { card: leg2, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "TOO_MANY_LEGENDARIES"));
  });

  it("SAGE: legendary more than 1 copy", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Young",
      types: ["Hero", "Young", "Warrior"],
      sageLegal: true,
    });
    const leg = buildCard({
      uniqueId: "l1",
      name: "Leg",
      types: ["Action", "Warrior"],
      sageLegal: true,
      rarities: ["Legendary"],
    });
    const errors = v.validate(DeckFormat.SAGE, hero, [
      { card: leg, quantity: 2, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "LEGENDARY_COPY_LIMIT"));
  });

  it("Commoner: rejects non Common/Rare rarity when rarities set", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Young",
      types: ["Hero", "Young", "Warrior"],
      commonerLegal: true,
    });
    const maj = buildCard({
      uniqueId: "m1",
      name: "Majestic",
      types: ["Action", "Warrior"],
      commonerLegal: true,
      rarities: ["Majestic", "M"],
    });
    const errors = v.validate(DeckFormat.COMMONER, hero, [
      { card: maj, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "RARITY_NOT_ALLOWED"));
  });

  it("class mismatch: non-Generic card does not match hero", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Warrior Hero",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const wizardCard = buildCard({
      uniqueId: "w1",
      name: "Wizard Bolt",
      types: ["Action", "Wizard"],
      typeText: "Wizard Action",
      ccLegal: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, [
      { card: wizardCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(errors.some((e) => e.code === "CLASS_MISMATCH"));
  });

  it("duplicate equipment slot Head", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Hero",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const head1 = buildCard({
      uniqueId: "e1",
      name: "Helm A",
      types: ["Equipment", "Generic", "Head"],
      ccLegal: true,
    });
    const head2 = buildCard({
      uniqueId: "e2",
      name: "Helm B",
      types: ["Equipment", "Generic", "Head"],
      ccLegal: true,
    });
    const errors = v.validate(DeckFormat.CC, hero, [
      { card: head1, quantity: 1, zone: CardZone.EQUIPMENT },
      { card: head2, quantity: 1, zone: CardZone.EQUIPMENT },
    ]);
    assert.ok(errors.some((e) => e.code === "DUPLICATE_EQUIPMENT_SLOT"));
  });

  it("Revered Guardian: allows Guardian+Revered; rejects Ice Guardian", () => {
    const hero = buildCard({
      uniqueId: "pleiades-superstar",
      name: "Pleiades, Superstar",
      types: ["Hero", "Guardian"],
      cardKeywords: ["Revered"],
      ccLegal: true,
    });
    const reveredCard = buildCard({
      uniqueId: "rev-card",
      name: "Revered Strike",
      types: ["Action", "Attack", "Guardian"],
      cardKeywords: ["Revered"],
      ccLegal: true,
    });
    const iceGuardian = buildCard({
      uniqueId: "ice-g",
      name: "Glacial Bash",
      types: ["Action", "Attack", "Ice", "Guardian"],
      ccLegal: true,
    });

    const ok = v.validate(DeckFormat.CC, hero, [
      { card: reveredCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(
      !ok.some(
        (e) => e.code === "CLASS_MISMATCH" || e.code === "TALENT_MISMATCH",
      ),
    );

    const bad = v.validate(DeckFormat.CC, hero, [
      { card: iceGuardian, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(bad.some((e) => e.code === "TALENT_MISMATCH"));
  });

  it("Jarl-like: Ice granted only via HERO_TEXT_GRANTED_TALENTS (uniqueId), not from hero name", () => {
    const jarl = buildCard({
      uniqueId: "test_jarl_elemental_guardian",
      name: "Jarl, Elemental Guardian",
      types: ["Hero", "Guardian"],
      ccLegal: true,
    });
    const iceCard = buildCard({
      uniqueId: "ice-act",
      name: "Frost Fang",
      types: ["Action", "Attack", "Ice", "Guardian"],
      ccLegal: true,
    });
    const allowed = v.validate(DeckFormat.CC, jarl, [
      { card: iceCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(!allowed.some((e) => e.code === "TALENT_MISMATCH"));

    const plainGuardian = buildCard({
      uniqueId: "plain-guardian-hero",
      name: "Some Guardian",
      types: ["Hero", "Guardian"],
      ccLegal: true,
    });
    const denied = v.validate(DeckFormat.CC, plainGuardian, [
      { card: iceCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(denied.some((e) => e.code === "TALENT_MISMATCH"));
  });

  it("Light talent on card requires same talent on hero", () => {
    const noLight = buildCard({
      uniqueId: "war-1",
      name: "Dorinthea",
      types: ["Hero", "Warrior"],
      ccLegal: true,
    });
    const lightCard = buildCard({
      uniqueId: "ltw",
      name: "Light the Way",
      types: ["Action", "Warrior"],
      cardKeywords: ["Light"],
      ccLegal: true,
    });
    const fail = v.validate(DeckFormat.CC, noLight, [
      { card: lightCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(fail.some((e) => e.code === "TALENT_MISMATCH"));

    const withLight = buildCard({
      uniqueId: "war-2",
      name: "Boltyn",
      types: ["Hero", "Warrior"],
      cardKeywords: ["Light"],
      ccLegal: true,
    });
    const pass = v.validate(DeckFormat.CC, withLight, [
      { card: lightCard, quantity: 1, zone: CardZone.MAIN },
    ]);
    assert.ok(!pass.some((e) => e.code === "TALENT_MISMATCH"));
  });

  it("pool too large for Blitz", () => {
    const hero = buildCard({
      uniqueId: "h",
      name: "Young",
      types: ["Hero", "Young", "Warrior"],
      blitzLegal: true,
    });
    const entries = Array.from({ length: 41 }, (_, i) => ({
      card: buildCard({
        uniqueId: `f${i}`,
        name: `Filler ${i}`,
        types: ["Action", "Attack", "Warrior"],
        blitzLegal: true,
      }),
      quantity: 1,
      zone: CardZone.MAIN,
    }));
    const errors = v.validate(DeckFormat.BLITZ, hero, entries);
    assert.ok(errors.some((e) => e.code === "POOL_TOO_LARGE"));
  });
});
