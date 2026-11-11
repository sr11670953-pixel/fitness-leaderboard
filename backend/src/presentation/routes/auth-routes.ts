import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  ConflictError,
  UnauthorizedError,
} from "../../application/auth-service.js";
import { authService } from "../../container.js";
import { authenticate } from "../middlewares/authenticate.js";

const registerSchema = z.object({
  email: z.string().email().max(255),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

const SAME_SITE: "none" | "strict" =
  process.env.NODE_ENV === "production" ? "none" : "strict";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: SAME_SITE,
  path: "/auth",
} as const;

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const authRouter = Router();

authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await authService.register(parsed.data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const { user, accessToken, refreshToken } = await authService.login(
        parsed.data
      );

      res.cookie("refreshToken", refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      });

      res.status(200).json({ user, accessToken });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.refreshToken;
    if (typeof token !== "string" || token.length === 0) {
      res.status(401).json({ error: "Sesión inválida" });
      return;
    }

    try {
      const { accessToken, refreshToken } = await authService.refresh(token);
      res.cookie("refreshToken", refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      });
      res.status(200).json({ accessToken });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
        res.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
);

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.refreshToken;
    try {
      if (typeof token === "string" && token.length > 0) {
        await authService.logout(token);
      }
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/logout-all",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    try {
      await authService.logoutAll(userId);
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

authRouter.get("/me", authenticate, (req: Request, res: Response) => {
  res.json({ user: req.user });
});