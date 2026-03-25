import { Router } from "express";
import { cardController } from "../controllers/CardController";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  cardSearchSchema,
  cardUsageQuerySchema,
  fabCubeSyncSchema,
} from "../schemas/card.schema";
import { UserRole } from "../models";

const router = Router();

router.get(
  "/search",
  validate(cardSearchSchema, "query"),
  cardController.search.bind(cardController)
);

router.post(
  "/admin/sync-fabcube",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(fabCubeSyncSchema),
  cardController.syncFabCube.bind(cardController)
);

router.get("/:uniqueId", cardController.getById.bind(cardController));

router.get(
  "/:uniqueId/usage",
  validate(cardUsageQuerySchema, "query"),
  cardController.getUsage.bind(cardController)
);

export default router;
