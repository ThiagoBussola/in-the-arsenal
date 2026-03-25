import type { CardCache } from "../../src/models";

const defaults: Partial<CardCache> = {
  color: null,
  pitch: null,
  cost: null,
  power: null,
  defense: null,
  health: null,
  cardKeywords: [],
  functionalText: null,
  typeText: null,
  imageUrl: null,
  ccLegal: false,
  blitzLegal: false,
  commonerLegal: false,
  llLegal: false,
  ccBanned: false,
  blitzBanned: false,
  commonerBanned: false,
  llBanned: false,
  sageLegal: false,
  sageBanned: false,
  rarities: [],
  cachedAt: new Date(),
};

/** Plain object usable as `CardCache` for validation unit tests (no Sequelize). */
export function buildCard(
  partial: Partial<CardCache> & Pick<CardCache, "uniqueId" | "name" | "types">
): CardCache {
  return { ...defaults, ...partial } as CardCache;
}
