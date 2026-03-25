import { Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService";
import { userRepository } from "../repositories/UserRepository";
import { AppError } from "../middlewares/errorHandler";
import type { RegisterInput, LoginInput, RefreshInput, GoogleAuthInput } from "../schemas/auth.schema";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body as RegisterInput);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body as LoginInput);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body as RefreshInput;
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body as GoogleAuthInput;
      const result = await authService.googleLogin(idToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userRepository.findById(req.user!.userId);
      if (!user) throw new AppError(404, "User not found");
      res.json({ user: user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
