import { describe, expect, it, vi } from "vitest";
import { ActivityService } from "../src/application/activity-service.js";
import { PointsWorker } from "../src/application/points-worker.js";
import type { PointsJob } from "../src/domain/job-queue.js";
import { InMemoryLeaderboardStore } from "../src/infrastructure/leaderboard/in-memory-leaderboard-store.js";
import { InMemoryJobQueue } from "../src/infrastructure/queue/in-memory-job-queue.js";
import { CORRER, FakeActivityRepository } from "./helpers/fakes.js";

function wire() {
  const repo = new FakeActivityRepository();
  const leaderboard = new InMemoryLeaderboardStore();
  const queue = new InMemoryJobQueue<PointsJob>({ baseDelayMs: 1 });
  const worker = new PointsWorker(repo, leaderboard);
  queue.process((job) => worker.handle(job));
  const service = new ActivityService(repo, queue);
  return { repo, leaderboard, queue, service };
}

describe("flujo de puntos (servicio + cola + worker + ranking)", () => {
  it("registrar una actividad termina sumando 55 puntos al ranking", async () => {
    const { leaderboard, queue, service } = wire();

    const activity = await service.create("u1", {
      activityTypeId: CORRER.id,
      durationMinutes: 30,
      distanceKm: 5,
      performedAt: new Date(),
    });
    expect(activity.points).toBe(0);

    await vi.waitFor(async () => {
      expect(await leaderboard.top(10)).toEqual([{ userId: "u1", points: 55 }]);
    });
    await queue.stop();
  });

  it("recupera los puntos de actividades que quedaron sin procesar", async () => {
    const { repo, leaderboard, queue } = wire();
    for (const userId of ["u1", "u2"]) {
      await repo.create({
        userId,
        activityTypeId: CORRER.id,
        durationMinutes: 10,
        distanceKm: null,
        performedAt: new Date(),
      });
    }

    for (const job of await repo.listWithoutPoints()) {
      await queue.enqueue(job);
    }

    await vi.waitFor(async () => {
      expect(await leaderboard.top(10)).toHaveLength(2);
    });
    expect(await repo.listWithoutPoints()).toEqual([]);
    await queue.stop();
  });
});