import { CardCache } from "../models";
import { cardCacheRepository } from "../repositories/CardCacheRepository";
import { AppError } from "../middlewares/errorHandler";
import { env } from "../config/env";

/** Row shape from the-fab-cube `card-flattened.json` (English). */
export interface FabCubeFlattenedRow {
  unique_id: string;
  name: string;
  color: string;
  pitch: string;
  cost: string;
  power: string;
  defense: string;
  health: string;
  types: string[];
  card_keywords: string[];
  functional_text: string;
  type_text: string;
  image_url: string;
  cc_legal: boolean;
  blitz_legal: boolean;
  commoner_legal: boolean;
  ll_legal: boolean;
  cc_banned: boolean;
  blitz_banned: boolean;
  commoner_banned: boolean;
  ll_banned: boolean;
  foiling: string;
  rarity: string;
  silver_age_legal?: boolean;
  silver_age_banned?: boolean;
}

const RARITY_LETTER_TO_LABEL: Record<string, string> = {
  C: "Common",
  R: "Rare",
  M: "Majestic",
  L: "Legendary",
  F: "Fabled",
  B: "Basic",
  T: "Token",
  P: "Promo",
  S: "Special",
};

function raritiesFromRow(row: FabCubeFlattenedRow): string[] {
  const code = row.rarity?.trim();
  if (!code) return [];
  const label = RARITY_LETTER_TO_LABEL[code] || code;
  return label === code ? [code] : [label, code];
}

function pickRepresentativeRows(rows: FabCubeFlattenedRow[]): FabCubeFlattenedRow[] {
  const byUid = new Map<string, FabCubeFlattenedRow[]>();
  for (const row of rows) {
    const uid = row.unique_id;
    if (!uid) continue;
    const list = byUid.get(uid) || [];
    list.push(row);
    byUid.set(uid, list);
  }

  const picked: FabCubeFlattenedRow[] = [];
  for (const group of byUid.values()) {
    const std = group.find((r) => r.foiling === "S");
    picked.push(std || group[0]);
  }
  return picked;
}

function mapRowToCache(row: FabCubeFlattenedRow): Partial<CardCache> {
  const sageLegal = row.silver_age_legal ?? false;
  const sageBanned = row.silver_age_banned ?? false;

  return {
    uniqueId: row.unique_id,
    name: row.name,
    color: row.color || null,
    pitch: row.pitch || null,
    cost: row.cost || null,
    power: row.power || null,
    defense: row.defense || null,
    health: row.health || null,
    types: row.types || [],
    cardKeywords: row.card_keywords || [],
    functionalText: row.functional_text || null,
    typeText: row.type_text || null,
    imageUrl: row.image_url || null,
    ccLegal: row.cc_legal ?? false,
    blitzLegal: row.blitz_legal ?? false,
    commonerLegal: row.commoner_legal ?? false,
    llLegal: row.ll_legal ?? false,
    ccBanned: row.cc_banned ?? false,
    blitzBanned: row.blitz_banned ?? false,
    commonerBanned: row.commoner_banned ?? false,
    llBanned: row.ll_banned ?? false,
    sageLegal,
    sageBanned,
    rarities: raritiesFromRow(row),
    cachedAt: new Date(),
  } as Partial<CardCache>;
}

export class FabCubeSyncService {
  async syncFromUrl(jsonUrl: string): Promise<{ upserted: number; source: string }> {
    const res = await fetch(jsonUrl, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new AppError(502, `Failed to fetch card JSON (${res.status})`);
    }

    const raw = (await res.json()) as FabCubeFlattenedRow[];
    if (!Array.isArray(raw)) {
      throw new AppError(502, "Invalid card JSON: expected an array");
    }

    const picked = pickRepresentativeRows(raw);
    const BATCH = 200;
    let upserted = 0;

    for (let i = 0; i < picked.length; i += BATCH) {
      const slice = picked.slice(i, i + BATCH).map(mapRowToCache);
      await cardCacheRepository.upsertMany(slice);
      upserted += slice.length;
    }

    return { upserted, source: jsonUrl };
  }

  defaultEnglishFlattenedUrl(): string {
    return (
      env.FABCUBE_CARD_FLATTENED_URL ||
      "https://the-fab-cube.github.io/flesh-and-blood-cards/json/english/card-flattened.json"
    );
  }
}

export const fabCubeSyncService = new FabCubeSyncService();
