import { Request, Response, NextFunction } from "express";
import { cardService } from "../services/CardService";
import { cardUsageService } from "../services/CardUsageService";
import { fabCubeSyncService } from "../services/FabCubeSyncService";
import type {
  CardSearchInput,
  CardUsageQueryInput,
  FabCubeSyncInput,
} from "../schemas/card.schema";
import { DeckFormat } from "../models";

export class CardController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as CardSearchInput;
      const result = await cardService.search(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const card = await cardService.getByUniqueId(req.params.uniqueId as string);
      res.json(card);
    } catch (err) {
      next(err);
    }
  }

  async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as CardUsageQueryInput;
      const stats = await cardUsageService.getUsageForCard(
        req.params.uniqueId as string,
        query.hero,
        query.format as DeckFormat | undefined
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async syncFabCube(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as FabCubeSyncInput;
      const url =
        body.jsonUrl?.trim() || fabCubeSyncService.defaultEnglishFlattenedUrl();
      const result = await fabCubeSyncService.syncFromUrl(url);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const cardController = new CardController();
