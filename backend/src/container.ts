import { AuthService } from "./application/auth-service.js";
import { ChallengeService } from "./application/challenge-service.js";
import { LeaderboardService } from "./application/leaderboard-service.js";
import { PointsWorker } from "./application/points-worker.js";
import type { PointsJob } from "./domain/job-queue.js";
import { PgActivityRepository } from "./infrastructure/database/pg-activity-repository.js";
import { PgChallengeRepository } from "./infrastructure/database/pg-challenge-repository.js";
import { PgRefreshTokenRepository } from "./infrastructure/database/pg-refresh-token-repository.js";
import { PgUserRepository } from "./infrastructure/database/pg-user-repository.js";
import { InMemoryLeaderboardStore } from "./infrastructure/leaderboard/in-memory-leaderboard-store.js";
import { InMemoryJobQueue } from "./infrastructure/queue/in-memory-job-queue.js";

export const activityRepository = new PgActivityRepository();
export const userRepository = new PgUserRepository();
export const challengeRepository = new PgChallengeRepository();
export const pointsQueue = new InMemoryJobQueue<PointsJob>();
export const leaderboardStore = new InMemoryLeaderboardStore();
export const leaderboardService = new LeaderboardService(
  leaderboardStore,
  userRepository
);
export const challengeService = new ChallengeService(challengeRepository);
export const authService = new AuthService(
  userRepository,
  new PgRefreshTokenRepository()
);

const pointsWorker = new PointsWorker(activityRepository, leaderboardStore);
pointsQueue.process((job) => pointsWorker.handle(job));

export async function recoverMissingPoints(): Promise<number> {
  const pending = await activityRepository.listWithoutPoints();
  for (const job of pending) {
    await pointsQueue.enqueue(job);
  }
  return pending.length;
}

export async function rebuildLeaderboard(): Promise<number> {
  const totals = await activityRepository.listPointTotals();
  for (const total of totals) {
    await leaderboardStore.setScore(total.userId, total.points);
  }
  return totals.length;
}