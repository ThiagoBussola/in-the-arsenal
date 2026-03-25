import { Sequelize } from "sequelize";
import { cardCacheRepository } from "../repositories/CardCacheRepository";
import { CardCache } from "../models";
import { AppError } from "../middlewares/errorHandler";
import { env } from "../config/env";
import type { CardSearchInput } from "../schemas/card.schema";

const GOAGAIN_BASE = "https://api.goagain.dev/v1";

interface GoAgainCard {
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
  cc_legal: boolean;
  blitz_legal: boolean;
  commoner_legal: boolean;
  ll_legal: boolean;
  cc_banned: boolean;
  blitz_banned: boolean;
  commoner_banned: boolean;
  ll_banned: boolean;
  silver_age_legal: boolean;
  silver_age_banned: boolean;
  rarities: string[];
  printings: Array<{ image_url: string; rarity?: string }>;
}

interface GoAgainResponse {
  data: GoAgainCard[];
  total: number;
  limit: number;
  offset: number;
}

export type CardSearchFilters = CardSearchInput;

/** Normalize display names so FaBrary / FabCube / GoAgain apostrophes match. */
export function normalizeCardSearchName(name: string): string {
  return name
    .trim()
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/\s+/g, " ");
}

export class CardService {
  private mapApiToCache(card: GoAgainCard): Partial<CardCache> {
    return {
      uniqueId: card.unique_id,
      name: card.name,
      color: card.color || null,
      pitch: card.pitch || null,
      cost: card.cost || null,
      power: card.power || null,
      defense: card.defense || null,
      health: card.health || null,
      types: card.types || [],
      cardKeywords: card.card_keywords || [],
      functionalText: card.functional_text || null,
      typeText: card.type_text || null,
      imageUrl: card.printings?.[0]?.image_url || null,
      ccLegal: card.cc_legal ?? false,
      blitzLegal: card.blitz_legal ?? false,
      commonerLegal: card.commoner_legal ?? false,
      llLegal: card.ll_legal ?? false,
      ccBanned: card.cc_banned ?? false,
      blitzBanned: card.blitz_banned ?? false,
      commonerBanned: card.commoner_banned ?? false,
      llBanned: card.ll_banned ?? false,
      sageLegal: card.silver_age_legal ?? false,
      sageBanned: card.silver_age_banned ?? false,
      rarities: card.rarities ?? card.printings?.map((p) => p.rarity).filter(Boolean) ?? [],
      cachedAt: new Date(),
    } as any;
  }

  private async searchGoAgain(
    filters: CardSearchFilters
  ): Promise<{ cards: CardCache[]; total: number }> {
    const params = new URLSearchParams();
    if (filters.q) params.set("name", filters.q);
    if (filters.type) params.set("type", filters.type);
    if (filters.class) params.set("class", filters.class);
    if (filters.pitch) params.set("pitch", filters.pitch);
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.legalIn) params.set("legal_in", filters.legalIn);
    params.set("limit", String(filters.limit || 20));
    params.set("offset", String(filters.offset || 0));

    const url = `${GOAGAIN_BASE}/cards?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(502, "Card API returned an error");
    }

    const data = (await response.json()) as GoAgainResponse;

    const mapped = data.data.map((c) => this.mapApiToCache(c));
    await cardCacheRepository.upsertMany(mapped);

    const cards = await cardCacheRepository.findByUniqueIds(
      data.data.map((c) => c.unique_id)
    );

    return { cards, total: data.total };
  }

  async search(
    filters: CardSearchFilters
  ): Promise<{ cards: CardCache[]; total: number }> {
    const mode = env.CARD_SEARCH_SOURCE;

    if (mode === "goagain") {
      return this.searchGoAgain(filters);
    }

    const { rows, count } = await cardCacheRepository.searchFiltered(filters);

    if (mode === "cache") {
      return { cards: rows, total: count };
    }

    if (rows.length > 0 || count > 0) {
      return { cards: rows, total: count };
    }

    return this.searchGoAgain(filters);
  }

  async getByUniqueId(uniqueId: string): Promise<CardCache> {
    const cached = await cardCacheRepository.findFreshByUniqueId(uniqueId);
    if (cached) return cached;

    const url = `${GOAGAIN_BASE}/cards?name=&limit=1&offset=0`;
    const directUrl = `${GOAGAIN_BASE}/cards/${uniqueId}`;

    const response = await fetch(directUrl);
    if (!response.ok) {
      const existing = await cardCacheRepository.findByUniqueId(uniqueId);
      if (existing) return existing;
      throw new AppError(404, "Card not found");
    }

    const card = (await response.json()) as GoAgainCard;
    const mapped = this.mapApiToCache(card);
    return cardCacheRepository.upsert(mapped);
  }

  async getMany(uniqueIds: string[]): Promise<CardCache[]> {
    return cardCacheRepository.findByUniqueIds(uniqueIds);
  }

  /**
   * Exact name (+ optional pitch) match for FaBrary import. Uses DB cache first, then GoAgain
   * so imports work even when FabCube sync only filled part of `card_cache`.
   */
  private pickFabMatch(
    candidates: CardCache[],
    pitch: string | null
  ): CardCache | null {
    if (candidates.length === 0) return null;

    if (pitch) {
      const byPitch = candidates.filter((c) => c.pitch === pitch);
      if (byPitch.length >= 1) return byPitch[0];
      return null;
    }

    const heroes = candidates.filter((c) => c.types?.includes("Hero"));
    if (heroes.length === 1) return heroes[0];
    if (candidates.length === 1) return candidates[0];

    const gear = candidates.filter((c) =>
      c.types?.some((t) => t === "Equipment" || t === "Weapon")
    );
    if (gear.length === 1) return gear[0];

    return null;
  }

  async resolveForFabraryImport(
    name: string,
    pitch: string | null
  ): Promise<CardCache | null> {
    const normalized = normalizeCardSearchName(name);
    if (!normalized) return null;

    const candidates = await CardCache.findAll({
      where: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("name")),
        normalized.toLowerCase()
      ),
    });

    const cached = this.pickFabMatch(candidates, pitch);
    if (cached) return cached;

    try {
      const filters: CardSearchFilters = {
        q: normalized,
        limit: 80,
        offset: 0,
      };
      if (pitch) filters.pitch = pitch;

      const { cards } = await this.searchGoAgain(filters);
      const exact = cards.filter(
        (c) => c.name.toLowerCase() === normalized.toLowerCase()
      );
      const pool = exact.length > 0 ? exact : cards;
      return this.pickFabMatch(pool, pitch);
    } catch {
      return null;
    }
  }
}

export const cardService = new CardService();
