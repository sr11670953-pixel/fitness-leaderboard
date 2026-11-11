import type {
  ActivityForPoints,
  ActivityLog,
  ActivityRepository,
  ActivityType,
  NewActivityLog,
} from "../../src/domain/activity.js";
import type {
  JobHandler,
  JobQueue,
  PointsJob,
} from "../../src/domain/job-queue.js";

export const CORRER: ActivityType = {
  id: 1,
  name: "Correr",
  pointsPerMinute: 1,
  pointsPerKm: 5,
};

export class FakeActivityRepository implements ActivityRepository {
  readonly types = new Map<number, ActivityType>([[CORRER.id, CORRER]]);
  readonly logs = new Map<string, ActivityLog>();
  readonly savedPoints = new Map<string, { userId: string; points: number }>();
  private nextId = 1;

  async findTypeById(id: number): Promise<ActivityType | null> {
    return this.types.get(id) ?? null;
  }

  async listTypes(): Promise<ActivityType[]> {
    return [...this.types.values()];
  }

  async create(activity: NewActivityLog): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: `log-${this.nextId++}`,
      userId: activity.userId,
      activityTypeId: activity.activityTypeId,
      activityTypeName: this.types.get(activity.activityTypeId)?.name ?? "",
      durationMinutes: activity.durationMinutes,
      distanceKm: activity.distanceKm,
      performedAt: activity.performedAt,
      createdAt: new Date(),
      points: 0,
    };
    this.logs.set(log.id, log);
    return log;
  }

  async listByUser(userId: string): Promise<ActivityLog[]> {
    return [...this.logs.values()].filter((log) => log.userId === userId);
  }

  async findByIdForUser(
    id: string,
    userId: string
  ): Promise<ActivityLog | null> {
    const log = this.logs.get(id);
    return log && log.userId === userId ? log : null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const log = this.logs.get(id);
    if (!log || log.userId !== userId) return false;
    return this.logs.delete(id);
  }

  async findForPoints(id: string): Promise<ActivityForPoints | null> {
    const log = this.logs.get(id);
    if (!log) return null;
    const type = this.types.get(log.activityTypeId);
    if (!type) return null;
    return {
      id: log.id,
      userId: log.userId,
      durationMinutes: log.durationMinutes,
      distanceKm: log.distanceKm,
      pointsPerMinute: type.pointsPerMinute,
      pointsPerKm: type.pointsPerKm,
    };
  }

  async savePoints(
    activityLogId: string,
    userId: string,
    points: number
  ): Promise<boolean> {
    if (this.savedPoints.has(activityLogId)) return false;
    this.savedPoints.set(activityLogId, { userId, points });
    return true;
  }

  async listWithoutPoints(): Promise<
    { activityLogId: string; userId: string }[]
  > {
    return [...this.logs.values()]
      .filter((log) => !this.savedPoints.has(log.id))
      .map((log) => ({ activityLogId: log.id, userId: log.userId }));
  }

  async listPointTotals(): Promise<{ userId: string; points: number }[]> {
    const totals = new Map<string, number>();
    for (const saved of this.savedPoints.values()) {
      totals.set(saved.userId, (totals.get(saved.userId) ?? 0) + saved.points);
    }
    return [...totals.entries()].map(([userId, points]) => ({
      userId,
      points,
    }));
  }
}

export class FakeQueue implements JobQueue<PointsJob> {
  readonly jobs: PointsJob[] = [];
  failOnEnqueue = false;

  async enqueue(payload: PointsJob): Promise<void> {
    if (this.failOnEnqueue) throw new Error("cola caída");
    this.jobs.push(payload);
  }

  process(_handler: JobHandler<PointsJob>): void {}

  async stop(): Promise<void> {}
}