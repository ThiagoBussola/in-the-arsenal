import { Op } from "sequelize";
import { CardCache } from "../models";
import type { CardSearchInput } from "../schemas/card.schema";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class CardCacheRepository {
  async findByUniqueId(uniqueId: string): Promise<CardCache | null> {
    return CardCache.findByPk(uniqueId);
  }

  async findFreshByUniqueId(uniqueId: string): Promise<CardCache | null> {
    return CardCache.findOne({
      where: {
        uniqueId,
        cachedAt: { [Op.gte]: new Date(Date.now() - CACHE_TTL_MS) },
      },
    });
  }

  async searchByName(query: string, limit = 20): Promise<CardCache[]> {
    return CardCache.findAll({
      where: { name: { [Op.iLike]: `%${query}%` } },
      order: [["name", "ASC"]],
      limit,
    });
  }

  async upsert(data: Partial<CardCache>): Promise<CardCache> {
    const [card] = await CardCache.upsert(data as any);
    return card;
  }

  async upsertMany(cards: Partial<CardCache>[]): Promise<void> {
    for (const card of cards) {
      await CardCache.upsert(card as any);
    }
  }

  async findByUniqueIds(ids: string[]): Promise<CardCache[]> {
    return CardCache.findAll({
      where: { uniqueId: { [Op.in]: ids } },
    });
  }

  async searchFiltered(
    filters: CardSearchInput
  ): Promise<{ rows: CardCache[]; count: number }> {
    const where: Record<string, unknown> = {};

    if (filters.q?.trim()) {
      where.name = { [Op.iLike]: `%${filters.q.trim()}%` };
    }

    if (filters.type?.trim()) {
      where.types = { [Op.contains]: [filters.type.trim()] };
    }

    if (filters.pitch?.trim()) {
      where.pitch = filters.pitch.trim();
    }

    if (filters.keyword?.trim()) {
      where.cardKeywords = { [Op.contains]: [filters.keyword.trim()] };
    }

    const legal = filters.legalIn;
    if (legal === "cc") {
      where.ccLegal = true;
    } else if (legal === "blitz") {
      where.blitzLegal = true;
    } else if (legal === "commoner") {
      where.commonerLegal = true;
    } else if (legal === "ll") {
      where.llLegal = true;
    } else if (legal === "sage") {
      where.sageLegal = true;
    }

    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    const result = await CardCache.findAndCountAll({
      where: where as any,
      order: [["name", "ASC"]],
      limit,
      offset,
    });
    const rawCount = result.count;
    const count = Array.isArray(rawCount) ? rawCount.length : rawCount;
    return { rows: result.rows, count };
  }
}

export const cardCacheRepository = new CardCacheRepository();
