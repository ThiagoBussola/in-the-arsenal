import type { CardData } from "./types";

/** Map API / Sequelize JSON (camelCase) to `CardData`. */
export function cardFromApiJson(raw: Record<string, unknown>): CardData {
  const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

  return {
    uniqueId: String(raw.uniqueId ?? ""),
    name: String(raw.name ?? ""),
    color: (raw.color as string | null) ?? null,
    pitch: (raw.pitch as string | null) ?? null,
    cost: (raw.cost as string | null) ?? null,
    power: (raw.power as string | null) ?? null,
    defense: (raw.defense as string | null) ?? null,
    health: (raw.health as string | null) ?? null,
    types: arr(raw.types),
    cardKeywords: arr(raw.cardKeywords),
    functionalText: (raw.functionalText as string | null) ?? null,
    typeText: (raw.typeText as string | null) ?? null,
    imageUrl: (raw.imageUrl as string | null) ?? null,
    ccLegal: Boolean(raw.ccLegal),
    blitzLegal: Boolean(raw.blitzLegal),
    commonerLegal: Boolean(raw.commonerLegal),
    llLegal: Boolean(raw.llLegal),
    ccBanned: Boolean(raw.ccBanned),
    blitzBanned: Boolean(raw.blitzBanned),
    commonerBanned: Boolean(raw.commonerBanned),
    llBanned: Boolean(raw.llBanned),
    sageLegal: Boolean(raw.sageLegal),
    sageBanned: Boolean(raw.sageBanned),
    rarities: arr(raw.rarities),
  };
}
