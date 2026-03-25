import { sequelize } from "../config/database";
import { CardUsageStat, DeckFormat } from "../models";
import { QueryTypes } from "sequelize";

export class CardUsageService {
  async getUsageForCard(
    cardUniqueId: string,
    heroCardId?: string,
    format?: DeckFormat
  ): Promise<CardUsageStat[]> {
    const where: any = { cardUniqueId };
    if (heroCardId) where.heroCardId = heroCardId;
    if (format) where.format = format;

    return CardUsageStat.findAll({ where, order: [["usagePercentage", "DESC"]] });
  }

  async getTopCardsForHero(
    heroCardId: string,
    format: DeckFormat,
    limit = 20
  ): Promise<CardUsageStat[]> {
    return CardUsageStat.findAll({
      where: { heroCardId, format },
      order: [["usagePercentage", "DESC"]],
      limit,
    });
  }

  async refreshStats(): Promise<void> {
    await sequelize.query(`DELETE FROM card_usage_stats`);

    const stats = await sequelize.query<{
      hero_card_id: string;
      card_unique_id: string;
      format: string;
      deck_count: string;
      total_hero_decks: string;
    }>(
      `
      WITH public_decks AS (
        SELECT d.id, d.hero_card_id, d.format
        FROM decks d
        WHERE d.visibility = 'PUBLIC'
          AND d.hero_card_id IS NOT NULL
      ),
      hero_totals AS (
        SELECT hero_card_id, format, COUNT(*)::int AS total
        FROM public_decks
        GROUP BY hero_card_id, format
      ),
      card_counts AS (
        SELECT
          pd.hero_card_id,
          dc.card_unique_id,
          pd.format,
          COUNT(DISTINCT pd.id)::int AS deck_count
        FROM public_decks pd
        JOIN deck_cards dc ON dc.deck_id = pd.id
        GROUP BY pd.hero_card_id, dc.card_unique_id, pd.format
      )
      SELECT
        cc.hero_card_id,
        cc.card_unique_id,
        cc.format,
        cc.deck_count,
        ht.total AS total_hero_decks
      FROM card_counts cc
      JOIN hero_totals ht
        ON ht.hero_card_id = cc.hero_card_id
        AND ht.format = cc.format
      `,
      { type: QueryTypes.SELECT }
    );

    if (stats.length === 0) return;

    const records = stats.map((s) => ({
      heroCardId: s.hero_card_id,
      cardUniqueId: s.card_unique_id,
      format: s.format,
      deckCount: parseInt(s.deck_count, 10),
      totalHeroDecks: parseInt(s.total_hero_decks, 10),
      usagePercentage:
        Math.round(
          (parseInt(s.deck_count, 10) / parseInt(s.total_hero_decks, 10)) *
            10000
        ) / 100,
      updatedAt: new Date(),
    }));

    await CardUsageStat.bulkCreate(records as any[]);
  }
}

export const cardUsageService = new CardUsageService();
