import { Request, Response, NextFunction } from "express";
import { postService } from "../services/PostService";
import type { CreatePostInput, UpdatePostInput, PostQueryInput } from "../schemas/post.schema";

export class PostController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.create(
        req.user!.userId,
        req.body as CreatePostInput
      );
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postService.list(req.query as unknown as PostQueryInput);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.findById(req.params.id as string);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.findBySlug(req.params.slug as string);
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.update(
        req.params.id as string,
        req.user!.userId,
        req.user!.role,
        req.body as UpdatePostInput
      );
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await postService.delete(
        req.params.id as string,
        req.user!.userId,
        req.user!.role
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const postController = new PostController();
