/**
 * FaB constructed deck identity (simplified from tournament deck-building rules).
 *
 * **Rule we encode:** A non-Generic card may be included only if the hero supplies
 * every **class** and every **talent** that appears on that card’s type line / keywords.
 * Generic cards are always allowed (handled before this module runs).
 *
 * This matches the common reading of “cards that share the same class and/or talent as the hero”:
 * a card that lists both `Guardian` and `Ice` requires a hero that is Guardian **and** has the
 * Ice talent (from the hero card), not merely Guardian.
 *
 * **Important limitations**
 * - We only recognise classes/talents that appear in `FAB_CLASS_TYPES` / `FAB_TALENT_TYPES`
 *   (matched case-insensitively on `types` + `cardKeywords`). Anything else on the card is ignored.
 * - Talents granted **only** by hero ability text (e.g. Jarl’s Ice/Earth) are **not** inferred from
 *   names or the word “Elemental”. They must be listed in `HERO_TEXT_GRANTED_TALENTS` keyed by
 *   `CardCache.uniqueId` once you know the printing id from your card source.
 *
 * @see https://fabtcg.com/articles/masterclass-deckbuilding/ (class / talent overview)
 */

import type { CardCache } from "../models";

/** Primary classes printed on hero and class cards (lowercase keys). */
export const FAB_CLASS_TYPES = new Set(
  [
    "brute",
    "guardian",
    "ninja",
    "warrior",
    "wizard",
    "ranger",
    "mechanologist",
    "illusionist",
    "assassin",
    "merchant",
    "bard",
    "cleric",
    "shaman",
    "necromancer",
    "runeblade",
    "pirate",
    "warden",
  ].map((s) => s.toLowerCase()),
);

/**
 * Talents / special deck-building tags (lowercase keys).
 * Not inferred from hero name — only from hero/card tokens + text-grants map.
 */
export const FAB_TALENT_TYPES = new Set(
  [
    "ice",
    "earth",
    "lightning",
    "draconic",
    "light",
    "shadow",
    "revered",
    "reviled",
  ].map((s) => s.toLowerCase()),
);

export interface DeckIdentity {
  classes: string[];
  talents: string[];
}

function normToken(t: string): string {
  return t.trim().toLowerCase();
}

/** Collect recognised class + talent tokens from types and keywords. */
export function extractDeckIdentity(card: Pick<CardCache, "types" | "cardKeywords">): DeckIdentity {
  const raw = [...(card.types || []), ...(card.cardKeywords || [])].map(normToken);
  const classes: string[] = [];
  const talents: string[] = [];
  const seenC = new Set<string>();
  const seenT = new Set<string>();

  for (const t of raw) {
    if (!t) continue;
    if (FAB_CLASS_TYPES.has(t) && !seenC.has(t)) {
      seenC.add(t);
      classes.push(t);
    }
    if (FAB_TALENT_TYPES.has(t) && !seenT.has(t)) {
      seenT.add(t);
      talents.push(t);
    }
  }

  return { classes, talents };
}

/**
 * Extra talents the hero is treated as having because their **rules text** says so
 * (not duplicated on the type line in data). Key = `CardCache.uniqueId`.
 *
 * Add real GoAgain/FabCube ids here as you confirm them in your cache.
 */
export const HERO_TEXT_GRANTED_TALENTS: Record<string, string[]> = {
  // Test / placeholder ids — replace with GoAgain `unique_id` when syncing heroes.
  test_jarl_elemental_guardian: ["ice", "earth"],
  test_jarl_vetreidi: ["ice", "earth"],
};

function heroGrantedTalentsFromText(hero: CardCache): string[] {
  const extra = HERO_TEXT_GRANTED_TALENTS[hero.uniqueId];
  if (!extra?.length) return [];
  return [...new Set(extra.map(normToken).filter((t) => FAB_TALENT_TYPES.has(t)))];
}

/** Full hero identity for deck building (classes/talents the deck may require from cards). */
export function extractHeroDeckIdentity(hero: CardCache): DeckIdentity {
  const base = extractDeckIdentity(hero);
  const textTalents = heroGrantedTalentsFromText(hero);
  const talents = [...new Set([...base.talents, ...textTalents])];
  return { classes: base.classes, talents };
}

/**
 * Returns null if the non-generic card is allowed; otherwise an error detail.
 */
export function classifyDeckIdentityViolation(
  hero: DeckIdentity,
  card: DeckIdentity,
): { kind: "class" | "talent"; missing: string } | null {
  for (const c of card.classes) {
    if (!hero.classes.includes(c)) {
      return { kind: "class", missing: c };
    }
  }
  for (const t of card.talents) {
    if (!hero.talents.includes(t)) {
      return { kind: "talent", missing: t };
    }
  }
  return null;
}
