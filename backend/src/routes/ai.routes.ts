import { Router } from "express";
import { aiHelperController } from "../controllers/AIHelperController";
import { authenticate } from "../middlewares/authenticate";

const router = Router();

router.post("/chat", authenticate, (req, res, next) =>
  aiHelperController.chat(req, res, next)
);

export default router;
