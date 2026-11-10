import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { LeaderboardService } from "../../application/leaderboard-service.js";
import type { LeaderboardStore } from "../../domain/leaderboard.js";

export function attachLeaderboardSocket(
  server: Server,
  service: LeaderboardService,
  store: LeaderboardStore
): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/leaderboard" });

  async function snapshot(): Promise<string> {
    const entries = await service.getEntries();
    return JSON.stringify({ type: "leaderboard", entries });
  }

  async function broadcast(): Promise<void> {
    if (wss.clients.size === 0) return;
    const message = await snapshot();
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    }
  }

  wss.on("connection", (socket) => {
    snapshot()
      .then((message) => socket.send(message))
      .catch((error: unknown) => {
        console.error("No se pudo enviar el ranking inicial", error);
      });
  });

  store.onChange(() => {
    broadcast().catch((error: unknown) => {
      console.error("No se pudo difundir el ranking", error);
    });
  });

  return wss;
}