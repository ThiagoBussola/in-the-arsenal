import { Router } from "express";
import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";
import aiRoutes from "./ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
router.use("/ai", aiRoutes);

export default router;
