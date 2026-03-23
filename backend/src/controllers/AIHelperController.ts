import { Request, Response, NextFunction } from "express";
import { aiHelperService } from "../services/AIHelperService";
import { z } from "zod";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(20),
});

export class AIHelperController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { messages } = chatSchema.parse(req.body);
      const result = await aiHelperService.chat(messages);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const aiHelperController = new AIHelperController();
