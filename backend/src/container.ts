import { PointsWorker } from "./application/points-worker.js";
import type { PointsJob } from "./domain/job-queue.js";
import { PgActivityRepository } from "./infrastructure/database/pg-activity-repository.js";
import { InMemoryJobQueue } from "./infrastructure/queue/in-memory-job-queue.js";

export const activityRepository = new PgActivityRepository();
export const pointsQueue = new InMemoryJobQueue<PointsJob>();

const pointsWorker = new PointsWorker(activityRepository);
pointsQueue.process((job) => pointsWorker.handle(job));