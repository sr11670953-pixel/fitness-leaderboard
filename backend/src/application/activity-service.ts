import type { JobQueue, PointsJob } from "../domain/job-queue.js";
import type {

  ActivityLog,
  ActivityRepository,
  ActivityType,
} from "../domain/activity.js";
export class NotFoundError extends Error {}
export class ValidationError extends Error {}

export interface CreateActivityInput {
  activityTypeId: number;
  durationMinutes: number;
  distanceKm: number | null;
  performedAt: Date;
}

export function calculatePoints(
  type: Pick<ActivityType, "pointsPerMinute" | "pointsPerKm">,
  durationMinutes: number,
  distanceKm: number | null
): number {
  const byTime = durationMinutes * type.pointsPerMinute;
  const byDistance = (distanceKm ?? 0) * type.pointsPerKm;
  return Math.round(byTime + byDistance);
}

export class ActivityService {
  constructor(
  private readonly activities: ActivityRepository,
  private readonly pointsQueue: JobQueue<PointsJob>
) {}

  listTypes(): Promise<ActivityType[]> {
    return this.activities.listTypes();
  }

  async create(
    userId: string,
    input: CreateActivityInput
  ): Promise<ActivityLog> {
    const type = await this.activities.findTypeById(input.activityTypeId);
    if (!type) {
      throw new ValidationError("El tipo de actividad no existe");
    }

    if (input.performedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new ValidationError("La fecha no puede estar en el futuro");
    }

    const activity = await this.activities.create({
      userId,
      activityTypeId: type.id,
      durationMinutes: input.durationMinutes,
      distanceKm: input.distanceKm,
      performedAt: input.performedAt,
    });

    try {
      await this.pointsQueue.enqueue({
        activityLogId: activity.id,
        userId,
      });
    } catch (error) {
      // La actividad ya está guardada; el paso 5d recalcula los puntos que falten.
      console.error("No se pudo encolar el cálculo de puntos", error);
    }

    return activity;
  }
  list(userId: string): Promise<ActivityLog[]> {
    return this.activities.listByUser(userId);
  }

  async getById(userId: string, id: string): Promise<ActivityLog> {
    const activity = await this.activities.findByIdForUser(id, userId);
    if (!activity) throw new NotFoundError("Actividad no encontrada");
    return activity;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.activities.deleteForUser(id, userId);
    if (!deleted) throw new NotFoundError("Actividad no encontrada");
  }
}