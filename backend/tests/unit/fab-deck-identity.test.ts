import { describe, it, assert } from "poku";
import {
  extractDeckIdentity,
  extractHeroDeckIdentity,
  classifyDeckIdentityViolation,
  HERO_TEXT_GRANTED_TALENTS,
} from "../../src/rules/fabDeckIdentity";
import { buildCard } from "../helpers/card-fixtures";

describe("fabDeckIdentity — pure rules", () => {
  it("extracts class and talent tokens from types + keywords (case-insensitive)", () => {
    const id = extractDeckIdentity({
      types: ["Action", "ICE", "Guardian"],
      cardKeywords: ["Revered"],
    });
    assert.deepStrictEqual(id.classes, ["guardian"]);
    assert.deepStrictEqual(id.talents.sort(), ["ice", "revered"].sort());
  });

  it("classifyDeckIdentityViolation: card needs ice hero lacks → talent", () => {
    const hero = { classes: ["guardian"], talents: ["revered"] };
    const card = { classes: ["guardian"], talents: ["ice"] };
    const v = classifyDeckIdentityViolation(hero, card);
    assert.ok(v);
    assert.strictEqual(v!.kind, "talent");
    assert.strictEqual(v!.missing, "ice");
  });

  it("hero text grants merge into extractHeroDeckIdentity", () => {
    assert.ok(HERO_TEXT_GRANTED_TALENTS.test_jarl_elemental_guardian);
    assert.ok(HERO_TEXT_GRANTED_TALENTS.test_jarl_vetreidi);
    const hero = buildCard({
      uniqueId: "test_jarl_vetreidi",
      name: "Jarl Vetreiði",
      types: ["Hero", "Guardian"],
    });
    const id = extractHeroDeckIdentity(hero);
    assert.ok(id.talents.includes("ice"));
    assert.ok(id.talents.includes("earth"));
  });
});
