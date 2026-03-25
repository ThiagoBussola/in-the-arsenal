import { Request, Response, NextFunction } from "express";
import { deckService } from "../services/DeckService";
import type {
  CreateDeckInput,
  UpdateDeckInput,
  AddCardInput,
  ReplaceCardsInput,
  DeckQueryInput,
  FabraryImportInput,
} from "../schemas/deck.schema";
import { DeckFormat } from "../models";
import { fabraryImportService } from "../services/FabraryImportService";

export class DeckController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const deck = await deckService.create(
        req.user!.userId,
        req.body as CreateDeckInput
      );
      res.status(201).json(deck);
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as DeckQueryInput;
      const result = await deckService.listUserDecks(req.user!.userId, {
        format: query.format as DeckFormat | undefined,
        search: query.search,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as DeckQueryInput;
      const result = await deckService.listPublicDecks({
        format: query.format as DeckFormat | undefined,
        heroCardId: query.heroCardId,
        search: query.search,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getByIdOrSlug(req: Request, res: Response, next: NextFunction) {
    try {
      const deck = await deckService.getByIdOrSlug(
        req.params.idOrSlug as string,
        req.user?.userId
      );
      res.json(deck);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const deck = await deckService.update(
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
        req.body as UpdateDeckInput
      );
      res.json(deck);
    } catch (err) {
      next(err);
    }
  }

  async addCard(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await deckService.addCard(
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
        req.body as AddCardInput
      );
      res.status(201).json(card);
    } catch (err) {
      next(err);
    }
  }

  async removeCard(req: Request, res: Response, next: NextFunction) {
    try {
      await deckService.removeCard(
        req.params.id as string,
        req.params.cardId as string,
        req.user!.userId,
        req.user!.role
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async replaceCards(req: Request, res: Response, next: NextFunction) {
    try {
      const { cards } = req.body as ReplaceCardsInput;
      const deck = await deckService.replaceCards(
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
        cards
      );
      res.json(deck);
    } catch (err) {
      next(err);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = await deckService.validate(req.params.id as string);
      res.json({ valid: errors.length === 0, errors });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await deckService.delete(
        req.params.id as string,
        req.user!.userId,
        req.user!.role
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async importFabrary(req: Request, res: Response, next: NextFunction) {
    try {
      const { raw } = req.body as FabraryImportInput;
      const result = await fabraryImportService.importFromText(raw);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const deckController = new DeckController();
