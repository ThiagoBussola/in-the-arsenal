import { deckRepository, DeckFilters } from "../repositories/DeckRepository";
import { cardCacheRepository } from "../repositories/CardCacheRepository";
import { deckValidationService, ValidationError } from "./DeckValidationService";
import { cardService } from "./CardService";
import { Deck, DeckVisibility, DeckCard, CardZone } from "../models";
import { AppError } from "../middlewares/errorHandler";

interface CreateDeckInput {
  name: string;
  slug: string;
  description?: string;
  heroCardId?: string;
  format: string;
  visibility?: string;
}

interface AddCardInput {
  cardUniqueId: string;
  quantity: number;
  zone: string;
}

export class DeckService {
  async create(userId: string, input: CreateDeckInput): Promise<Deck> {
    const existing = await deckRepository.findBySlug(input.slug);
    if (existing) throw new AppError(409, "A deck with this slug already exists");

    if (input.heroCardId) {
      await cardService.getByUniqueId(input.heroCardId);
    }

    const deck = await deckRepository.create({ ...input, userId } as any);
    return (await deckRepository.findById(deck.id))!;
  }

  async getByIdOrSlug(
    idOrSlug: string,
    requesterId?: string
  ): Promise<Deck> {
    const deck = await deckRepository.findByIdOrSlug(idOrSlug);
    if (!deck) throw new AppError(404, "Deck not found");

    if (
      deck.visibility === DeckVisibility.PRIVATE &&
      deck.userId !== requesterId
    ) {
      throw new AppError(404, "Deck not found");
    }

    return deck;
  }

  private async attachCardCounts<
    T extends { rows: Deck[]; count: number; page: number; totalPages: number },
  >(result: T): Promise<Omit<T, "rows"> & { rows: Record<string, unknown>[] }> {
    const ids = result.rows.map((d) => d.id);
    const totals = await deckRepository.sumQuantitiesByDeckIds(ids);
    const rows = result.rows.map((d) => {
      const o = d.toJSON() as Record<string, unknown>;
      o.cardCount = totals.get(d.id) ?? 0;
      return o;
    });
    return { ...result, rows };
  }

  async listUserDecks(userId: string, filters: DeckFilters = {}) {
    const result = await deckRepository.findAll({ ...filters, userId });
    return this.attachCardCounts(result);
  }

  async listPublicDecks(filters: DeckFilters = {}) {
    const result = await deckRepository.findAll({
      ...filters,
      visibility: DeckVisibility.PUBLIC,
    });
    return this.attachCardCounts(result);
  }

  async update(
    id: string,
    userId: string,
    role: string,
    input: Partial<CreateDeckInput>
  ): Promise<Deck> {
    const deck = await this.assertOwnership(id, userId, role);

    if (input.slug && input.slug !== deck.slug) {
      const existing = await deckRepository.findBySlug(input.slug);
      if (existing) throw new AppError(409, "Slug already taken");
    }

    if (input.heroCardId) {
      await cardService.getByUniqueId(input.heroCardId);
    }

    await deckRepository.update(id, input as any);
    return (await deckRepository.findById(id))!;
  }

  async addCard(
    deckId: string,
    userId: string,
    role: string,
    input: AddCardInput
  ): Promise<DeckCard> {
    await this.assertOwnership(deckId, userId, role);
    await cardService.getByUniqueId(input.cardUniqueId);

    return deckRepository.addCard(
      deckId,
      input.cardUniqueId,
      input.quantity,
      input.zone
    );
  }

  async removeCard(
    deckId: string,
    cardUniqueId: string,
    userId: string,
    role: string
  ): Promise<void> {
    await this.assertOwnership(deckId, userId, role);
    const removed = await deckRepository.removeCard(deckId, cardUniqueId);
    if (!removed) throw new AppError(404, "Card not found in deck");
  }

  async replaceCards(
    deckId: string,
    userId: string,
    role: string,
    cards: AddCardInput[]
  ): Promise<Deck> {
    await this.assertOwnership(deckId, userId, role);

    const uniqueCardIds = [...new Set(cards.map((c) => c.cardUniqueId))];
    for (const cardId of uniqueCardIds) {
      await cardService.getByUniqueId(cardId);
    }

    await deckRepository.replaceCards(
      deckId,
      cards.map((c) => ({
        cardUniqueId: c.cardUniqueId,
        quantity: c.quantity,
        zone: c.zone,
      }))
    );

    return (await deckRepository.findById(deckId))!;
  }

  async validate(deckId: string): Promise<ValidationError[]> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new AppError(404, "Deck not found");

    const deckCards = await deckRepository.getDeckCards(deckId);
    const cardIds = deckCards.map((dc) => dc.cardUniqueId);

    let hero = null;
    if (deck.heroCardId) {
      hero = await cardCacheRepository.findByUniqueId(deck.heroCardId);
    }

    const cards = await cardCacheRepository.findByUniqueIds(cardIds);
    const cardMap = new Map(cards.map((c) => [c.uniqueId, c]));

    const entries = deckCards
      .filter((dc) => cardMap.has(dc.cardUniqueId))
      .map((dc) => ({
        card: cardMap.get(dc.cardUniqueId)!,
        quantity: dc.quantity,
        zone: dc.zone as CardZone,
      }));

    return deckValidationService.validate(deck.format, hero, entries);
  }

  async delete(id: string, userId: string, role: string): Promise<void> {
    await this.assertOwnership(id, userId, role);
    await deckRepository.delete(id);
  }

  private async assertOwnership(
    deckId: string,
    userId: string,
    role: string
  ): Promise<Deck> {
    const deck = await deckRepository.findById(deckId);
    if (!deck) throw new AppError(404, "Deck not found");
    if (deck.userId !== userId && role !== "ADMIN") {
      throw new AppError(403, "You can only modify your own decks");
    }
    return deck;
  }
}

export const deckService = new DeckService();
