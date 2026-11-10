import { Router, type NextFunction, type Request, type Response } from "express";
import { rebuildLeaderboard } from "../../container.js";
import { authenticate, requireRole } from "../middlewares/authenticate.js";

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