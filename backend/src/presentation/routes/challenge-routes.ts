import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { NotFoundError, ValidationError } from "../../application/activity-service.js";
import { challengeService } from "../../container.js";
import { authenticate } from "../middlewares/authenticate.js";

const createChallengeSchema = z.object({
  name: z.string().trim().min(3).max(100),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

const idSchema = z.string().uuid();

export const challengeRouter = Router();

challengeRouter.use(authenticate);

function handleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  next(error);
}

challengeRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      res.json(await challengeService.list(userId));
    } catch (error) {
      next(error);
    }
  }
);

challengeRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createChallengeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Datos inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      const challenge = await challengeService.create(userId, parsed.data);
      res.status(201).json(challenge);
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

challengeRouter.post(
  "/:id/join",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Id inválido" });
      return;
    }
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      res.json(await challengeService.join(userId, id.data));
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

challengeRouter.get(
  "/:id/leaderboard",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Id inválido" });
      return;
    }
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      const entries = await challengeService.leaderboard(userId, id.data);
      res.json({ entries });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);