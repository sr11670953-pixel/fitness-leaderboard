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
  type: ActivityType,
  durationMinutes: number,
  distanceKm: number | null
): number {
  const byTime = durationMinutes * type.pointsPerMinute;
  const byDistance = (distanceKm ?? 0) * type.pointsPerKm;
  return Math.round(byTime + byDistance);
}

export class ActivityService {
  constructor(private readonly activities: ActivityRepository) {}

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

    const points = calculatePoints(
      type,
      input.durationMinutes,
      input.distanceKm
    );

    return this.activities.create({
      userId,
      activityTypeId: type.id,
      durationMinutes: input.durationMinutes,
      distanceKm: input.distanceKm,
      performedAt: input.performedAt,
      points,
    });
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