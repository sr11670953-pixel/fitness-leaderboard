import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config/env.js";
import { authRouter } from "./presentation/routes/auth-routes.js";
import cookieParser from "cookie-parser";
import { activityRouter } from "./presentation/routes/activity-routes.js";
import { leaderboardRouter } from "./presentation/routes/leaderboard-routes.js";
import { challengeRouter } from "./presentation/routes/challenge-routes.js";
import { attachLeaderboardSocket } from "./presentation/ws/leaderboard-socket.js";
import cors from "cors";
import {
  leaderboardService,
  leaderboardStore,
  pointsQueue,
  rebuildLeaderboard,
  recoverMissingPoints,
} from "./container.js";
import { pool } from "./infrastructure/database/pool.js";

const app = express();
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/activities", activityRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/challenges", challengeRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const server = app.listen(env.PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${env.PORT}`);
  rebuildLeaderboard()
    .then((users) => {
      console.log(`Ranking reconstruido: ${users} usuarios`);
      return recoverMissingPoints();
    })
    .then((count) => {
      if (count > 0) {
        console.log(`Puntos pendientes recuperados: ${count} actividades`);
      }
    })
    .catch((error: unknown) => {
      console.error("No se pudo preparar el ranking al arrancar", error);
    });
});

const wss = attachLeaderboardSocket(server, leaderboardService, leaderboardStore);

async function shutdown(): Promise<void> {
  wss.close();
  server.close();
  await pointsQueue.stop();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());