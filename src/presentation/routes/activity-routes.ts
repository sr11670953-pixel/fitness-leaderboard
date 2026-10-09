import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  ActivityService,
  NotFoundError,
  ValidationError,
} from "../../application/activity-service.js";
import { PgActivityRepository } from "../../infrastructure/database/pg-activity-repository.js";
import { authenticate } from "../middlewares/authenticate.js";

const createActivitySchema = z.object({
  activityTypeId: z.number().int().positive(),
  durationMinutes: z.number().int().positive().max(1440),
  distanceKm: z.number().nonnegative().max(1000).nullable().default(null),
  performedAt: z.coerce.date().default(() => new Date()),
});

const idSchema = z.string().uuid();

const activityService = new ActivityService(new PgActivityRepository());

export const activityRouter = Router();

activityRouter.use(authenticate);

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

activityRouter.get(
  "/types",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await activityService.listTypes());
    } catch (error) {
      next(error);
    }
  }
);

activityRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createActivitySchema.safeParse(req.body);
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
      const activity = await activityService.create(userId, parsed.data);
      res.status(201).json(activity);
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

activityRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: "No autenticado" });
        return;
      }
      res.json(await activityService.list(userId));
    } catch (error) {
      next(error);
    }
  }
);

activityRouter.get(
  "/:id",
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
      res.json(await activityService.getById(userId, id.data));
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

activityRouter.delete(
  "/:id",
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
      await activityService.remove(userId, id.data);
      res.status(204).send();
    } catch (error) {
      handleError(error, res, next);
    }
  }
);