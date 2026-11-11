import { describe, expect, it } from "vitest";
import { PointsWorker } from "../src/application/points-worker.js";
import { InMemoryLeaderboardStore } from "../src/infrastructure/leaderboard/in-memory-leaderboard-store.js";
import { CORRER, FakeActivityRepository } from "./helpers/fakes.js";

async function setup() {
  const repo = new FakeActivityRepository();
  const leaderboard = new InMemoryLeaderboardStore();
  const worker = new PointsWorker(repo, leaderboard);
  const log = await repo.create({
    userId: "u1",
    activityTypeId: CORRER.id,
    durationMinutes: 30,
    distanceKm: 5,
    performedAt: new Date(),
  });
  return { repo, leaderboard, worker, log };
}

describe("PointsWorker", () => {
  it("calcula y guarda los puntos y los suma al ranking", async () => {
    const { repo, leaderboard, worker, log } = await setup();
    await worker.handle({ activityLogId: log.id, userId: "u1" });
    expect(repo.savedPoints.get(log.id)?.points).toBe(55);
    expect(await leaderboard.top(10)).toEqual([{ userId: "u1", points: 55 }]);
  });

  it("es idempotente: un trabajo repetido no suma dos veces", async () => {
    const { leaderboard, worker, log } = await setup();
    await worker.handle({ activityLogId: log.id, userId: "u1" });
    await worker.handle({ activityLogId: log.id, userId: "u1" });
    expect(await leaderboard.top(10)).toEqual([{ userId: "u1", points: 55 }]);
  });

  it("ignora una actividad que ya fue borrada", async () => {
    const { leaderboard, worker } = await setup();
    await worker.handle({ activityLogId: "no-existe", userId: "u1" });
    expect(await leaderboard.top(10)).toEqual([]);
  });
});