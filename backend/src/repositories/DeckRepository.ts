import { Op, WhereOptions, fn, col } from "sequelize";
import { Deck, DeckCard, DeckVisibility, DeckFormat, User } from "../models";

export interface DeckFilters {
  userId?: string;
  format?: DeckFormat;
  visibility?: DeckVisibility;
  heroCardId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class DeckRepository {
  async findById(id: string): Promise<Deck | null> {
    return Deck.findByPk(id, {
      include: [
        { model: DeckCard },
        { model: User, attributes: ["id", "name"] },
      ],
    });
  }

  async findBySlug(slug: string): Promise<Deck | null> {
    return Deck.findOne({
      where: { slug },
      include: [
        { model: DeckCard },
        { model: User, attributes: ["id", "name"] },
      ],
    });
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Deck | null> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );
    return isUUID ? this.findById(idOrSlug) : this.findBySlug(idOrSlug);
  }

  async findAll(
    filters: DeckFilters = {}
  ): Promise<{ rows: Deck[]; count: number; page: number; totalPages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions = {};

    if (filters.userId) (where as any).userId = filters.userId;
    if (filters.format) (where as any).format = filters.format;
    if (filters.visibility) (where as any).visibility = filters.visibility;
    if (filters.heroCardId) (where as any).heroCardId = filters.heroCardId;
    if (filters.search) {
      (where as any).name = { [Op.iLike]: `%${filters.search}%` };
    }

    const { rows, count } = await Deck.findAndCountAll({
      where,
      include: [{ model: User, attributes: ["id", "name"] }],
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return { rows, count, page, totalPages: Math.ceil(count / limit) };
  }

  async create(data: Partial<Deck>): Promise<Deck> {
    return Deck.create(data as any);
  }

  async update(id: string, data: Partial<Deck>): Promise<Deck | null> {
    const deck = await Deck.findByPk(id);
    if (!deck) return null;
    return deck.update(data);
  }

  async delete(id: string): Promise<boolean> {
    const count = await Deck.destroy({ where: { id } });
    return count > 0;
  }

  async addCard(
    deckId: string,
    cardUniqueId: string,
    quantity: number,
    zone: string
  ): Promise<DeckCard> {
    const existing = await DeckCard.findOne({
      where: { deckId, cardUniqueId },
    });

    if (existing) {
      return existing.update({ quantity, zone });
    }

    return DeckCard.create({ deckId, cardUniqueId, quantity, zone } as any);
  }

  async removeCard(deckId: string, cardUniqueId: string): Promise<boolean> {
    const count = await DeckCard.destroy({ where: { deckId, cardUniqueId } });
    return count > 0;
  }

  async replaceCards(
    deckId: string,
    cards: Array<{ cardUniqueId: string; quantity: number; zone: string }>
  ): Promise<void> {
    await DeckCard.destroy({ where: { deckId } });
    if (cards.length) {
      await DeckCard.bulkCreate(
        cards.map((c) => ({ ...c, deckId })) as any[]
      );
    }
  }

  async getDeckCards(deckId: string): Promise<DeckCard[]> {
    return DeckCard.findAll({ where: { deckId } });
  }

  /** Sum of `quantity` per deck (main + equipment + weapon + sideboard). */
  async sumQuantitiesByDeckIds(deckIds: string[]): Promise<Map<string, number>> {
    if (deckIds.length === 0) return new Map();
    const rows = await DeckCard.findAll({
      attributes: ["deckId", [fn("SUM", col("quantity")), "total"]],
      where: { deckId: { [Op.in]: deckIds } },
      group: ["deckId"],
      raw: true,
    });
    const m = new Map<string, number>();
    for (const row of rows as unknown as { deckId: string; total: string }[]) {
      m.set(row.deckId, Number(row.total));
    }
    return m;
  }

  // Stub for future OpenSearch integration
  async findSimilar(_deckId: string): Promise<Deck[]> {
    return [];
  }
}

export const deckRepository = new DeckRepository();
