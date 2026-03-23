import { Router } from "express";
import { postController } from "../controllers/PostController";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/authenticate";
import {
  createPostSchema,
  updatePostSchema,
  postQuerySchema,
} from "../schemas/post.schema";

const router = Router();

router.get("/", validate(postQuerySchema, "query"), (req, res, next) =>
  postController.list(req, res, next)
);

router.get("/slug/:slug", (req, res, next) =>
  postController.getBySlug(req, res, next)
);

router.get("/:id", (req, res, next) =>
  postController.getById(req, res, next)
);

router.post(
  "/",
  authenticate,
  validate(createPostSchema),
  (req, res, next) => postController.create(req, res, next)
);

router.patch(
  "/:id",
  authenticate,
  validate(updatePostSchema),
  (req, res, next) => postController.update(req, res, next)
);

router.delete("/:id", authenticate, (req, res, next) =>
  postController.delete(req, res, next)
);

export default router;
