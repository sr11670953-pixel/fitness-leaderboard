import type { ActivityRepository } from "../domain/activity.js";
import type { PointsJob } from "../domain/job-queue.js";
import { calculatePoints } from "./activity-service.js";

export class PointsWorker {
  constructor(private readonly activities: ActivityRepository) {}

  async handle(job: PointsJob): Promise<void> {
    const activity = await this.activities.findForPoints(job.activityLogId);

    // La actividad pudo borrarse antes de procesarse: no hay nada que hacer.
    if (!activity) return;

    const points = calculatePoints(
      activity,
      activity.durationMinutes,
      activity.distanceKm
    );
    await this.activities.savePoints(activity.id, activity.userId, points);
  }
}