import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { userRepository } from "../repositories/UserRepository";
import { RefreshToken, User } from "../models";
import { AppError } from "../middlewares/errorHandler";
import type { JwtPayload } from "../middlewares/authenticate";
import type { RegisterInput, LoginInput } from "../schemas/auth.schema";

export class AuthService {
  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return num * (multipliers[unit] || 60_000);
  }

  private signAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(
      Date.now() + this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN)
    );

    await RefreshToken.create({
      token,
      expiresAt,
      userId,
    } as any);

    return token;
  }

  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash: input.password,
      // Email confirmation mocked — auto-confirm
      emailConfirmedAt: env.EMAIL_ENABLED ? null : new Date(),
    });

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(401, "Invalid credentials");
    }

    const valid = await user.verifyPassword(input.password);
    if (!valid) {
      throw new AppError(401, "Invalid credentials");
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: user.toSafeJSON(),
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string) {
    const record = await RefreshToken.findOne({ where: { token } });

    if (!record || !record.isValid) {
      if (record) await record.update({ revoked: true });
      throw new AppError(401, "Invalid or expired refresh token");
    }

    // Rotate: revoke old, issue new
    await record.update({ revoked: true });

    const user = await userRepository.findById(record.userId);
    if (!user) {
      throw new AppError(401, "User not found");
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async logout(token: string): Promise<void> {
    const record = await RefreshToken.findOne({ where: { token } });
    if (record) await record.update({ revoked: true });
  }
}

export const authService = new AuthService();
