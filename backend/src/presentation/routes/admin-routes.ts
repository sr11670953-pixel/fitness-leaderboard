import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { authService, rebuildLeaderboard } from "../../container.js";
import { authenticate, requireRole } from "../middlewares/authenticate.js";

const idSchema = z.string().uuid();

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));

adminRouter.post(
  "/leaderboard/rebuild",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await rebuildLeaderboard();
      res.json({ rebuiltUsers: users });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.post(
  "/users/:id/logout-all",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({ error: "Id inválido" });
      return;
    }
    try {
      await authService.logoutAll(id.data);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);