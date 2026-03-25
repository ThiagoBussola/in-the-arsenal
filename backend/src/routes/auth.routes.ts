import { Router } from "express";
import { authController } from "../controllers/AuthController";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/authenticate";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  googleAuthSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post("/refresh", validate(refreshSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post("/google", validate(googleAuthSchema), (req, res, next) =>
  authController.googleAuth(req, res, next)
);

router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next)
);

router.get("/me", authenticate, (req, res, next) =>
  authController.me(req, res, next)
);

export default router;
