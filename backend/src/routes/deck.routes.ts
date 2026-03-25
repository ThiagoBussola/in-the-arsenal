import { Router } from "express";
import { deckController } from "../controllers/DeckController";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  createDeckSchema,
  updateDeckSchema,
  addCardSchema,
  replaceCardsSchema,
  deckQuerySchema,
  fabraryImportSchema,
} from "../schemas/deck.schema";
import { optionalAuth } from "../middlewares/optionalAuth";

const router = Router();

router.get(
  "/public",
  validate(deckQuerySchema, "query"),
  deckController.listPublic.bind(deckController)
);

router.get(
  "/:idOrSlug",
  optionalAuth,
  deckController.getByIdOrSlug.bind(deckController)
);

router.use(authenticate);

router.post(
  "/import/fabrary",
  validate(fabraryImportSchema),
  deckController.importFabrary.bind(deckController)
);

router.post(
  "/",
  validate(createDeckSchema),
  deckController.create.bind(deckController)
);

router.get(
  "/",
  validate(deckQuerySchema, "query"),
  deckController.listMine.bind(deckController)
);

router.patch(
  "/:id",
  validate(updateDeckSchema),
  deckController.update.bind(deckController)
);

router.put(
  "/:id/cards",
  validate(replaceCardsSchema),
  deckController.replaceCards.bind(deckController)
);

router.post(
  "/:id/cards",
  validate(addCardSchema),
  deckController.addCard.bind(deckController)
);

router.delete(
  "/:id/cards/:cardId",
  deckController.removeCard.bind(deckController)
);

router.get("/:id/validate", deckController.validate.bind(deckController));

router.delete("/:id", deckController.delete.bind(deckController));

export default router;
