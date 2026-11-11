import { createHash, randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { RefreshTokenRepository } from "../domain/refresh-token.js";
import type { User, UserRepository } from "../domain/user.js";

export class ConflictError extends Error {}
export class UnauthorizedError extends Error {}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository
  ) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictError("El email ya está registrado");
    }
    if (await this.users.findByUsername(input.username)) {
      throw new ConflictError("El nombre de usuario ya está en uso");
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    const { passwordHash: _omit, ...publicUser } = await this.users.create({
      email,
      username: input.username,
      passwordHash,
    });
    return publicUser;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.users.findByEmail(input.email.toLowerCase());

    const valid =
      user !== null && (await argon2.verify(user.passwordHash, input.password));
    if (!user || !valid) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const { accessToken, refreshToken } = await this.issueTokens(
      user,
      randomUUID()
    );

    const { passwordHash: _omit, ...publicUser } = user;
    return { user: publicUser, accessToken, refreshToken };
  }

  async refresh(token: string): Promise<TokenPair> {
    const stored = await this.refreshTokens.findByHash(hashToken(token));
    if (!stored) {
      throw new UnauthorizedError("Sesión inválida");
    }

    if (stored.revokedAt !== null) {
      // Token reutilizado: posible robo, se cierra toda la sesión
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw new UnauthorizedError("Sesión inválida");
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError("Sesión expirada");
    }

    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedError("Sesión inválida");
    }

    await this.refreshTokens.revoke(stored.id);
    return this.issueTokens(user, stored.familyId);
  }

  async logout(token: string): Promise<void> {
    const stored = await this.refreshTokens.findByHash(hashToken(token));
    if (stored) {
      await this.refreshTokens.revokeFamily(stored.familyId);
    }
  }
    async logoutAll(userId: string): Promise<void> {
    await this.refreshTokens.revokeAllForUser(userId);
  }

  private async issueTokens(user: User, familyId: string): Promise<TokenPair> {
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    );

    const refreshToken = randomBytes(48).toString("hex");
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return { accessToken, refreshToken };
  }
}