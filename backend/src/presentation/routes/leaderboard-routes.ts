import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { leaderboardService } from "../../container.js";

export const leaderboardRouter = Router();

leaderboardRouter.get(
  "/",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const entries = await leaderboardService.getEntries();
      res.json({ entries });
    } catch (error) {
      next(error);
    }
  }
);