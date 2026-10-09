import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { AuthService, ConflictError } from "../../application/auth-service.js";
import { PgUserRepository } from "../../infrastructure/database/pg-user-repository.js";

const registerSchema = z.object({
  email: z.string().email().max(255),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  password: z.string().min(8).max(128),
});

const authService = new AuthService(new PgUserRepository());

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