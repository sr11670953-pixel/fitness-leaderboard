import type {
  ActivityForPoints,
  ActivityLog,
  ActivityRepository,
  ActivityType,
  NewActivityLog,
} from "../../domain/activity.js";
import { pool } from "./pool.js";

interface ActivityTypeRow {
  id: number;
  name: string;
  points_per_minute: string;
  points_per_km: string;
}

interface ActivityLogRow {
  id: string;
  user_id: string;
  activity_type_id: number;
  activity_type_name: string;
  duration_minutes: number;
  distance_km: string | null;
  performed_at: Date;
  created_at: Date;
  points: number | null;
}
interface ActivityForPointsRow {
  id: string;
  user_id: string;
  duration_minutes: number;
  distance_km: string | null;
  points_per_minute: string;
  points_per_km: string;
}

function toActivityType(row: ActivityTypeRow): ActivityType {
  return {
    id: row.id,
    name: row.name,
    pointsPerMinute: Number(row.points_per_minute),
    pointsPerKm: Number(row.points_per_km),
  };
}

function toActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    userId: row.user_id,
    activityTypeId: row.activity_type_id,
    activityTypeName: row.activity_type_name,
    durationMinutes: row.duration_minutes,
    distanceKm: row.distance_km === null ? null : Number(row.distance_km),
    performedAt: row.performed_at,
    createdAt: row.created_at,
    points: row.points ?? 0,
  };
}

const SELECT_ACTIVITY = `
  SELECT al.id, al.user_id, al.activity_type_id, at.name AS activity_type_name,
         al.duration_minutes, al.distance_km, al.performed_at, al.created_at,
         pe.points
  FROM activity_logs al
  JOIN activity_types at ON at.id = al.activity_type_id
  LEFT JOIN point_events pe ON pe.activity_log_id = al.id
`;

export class PgActivityRepository implements ActivityRepository {
  async findTypeById(id: number): Promise<ActivityType | null> {
    const result = await pool.query<ActivityTypeRow>(
      "SELECT * FROM activity_types WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    return row ? toActivityType(row) : null;
  }

  async listTypes(): Promise<ActivityType[]> {
    const result = await pool.query<ActivityTypeRow>(
      "SELECT * FROM activity_types ORDER BY id"
    );
    return result.rows.map(toActivityType);
  }

  async create(activity: NewActivityLog): Promise<ActivityLog> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const inserted = await client.query<{ id: string }>(
        `INSERT INTO activity_logs
           (user_id, activity_type_id, duration_minutes, distance_km, performed_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          activity.userId,
          activity.activityTypeId,
          activity.durationMinutes,
          activity.distanceKm,
          activity.performedAt,
        ]
      );
      const logId = inserted.rows[0]?.id;
      if (!logId) throw new Error("No se pudo crear la actividad");


      const full = await client.query<ActivityLogRow>(
        `${SELECT_ACTIVITY} WHERE al.id = $1`,
        [logId]
      );
      await client.query("COMMIT");

      const row = full.rows[0];
      if (!row) throw new Error("No se pudo leer la actividad creada");
      return toActivityLog(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listByUser(userId: string): Promise<ActivityLog[]> {
    const result = await pool.query<ActivityLogRow>(
      `${SELECT_ACTIVITY} WHERE al.user_id = $1 ORDER BY al.performed_at DESC`,
      [userId]
    );
    return result.rows.map(toActivityLog);
  }

  async findByIdForUser(id: string, userId: string): Promise<ActivityLog | null> {
    const result = await pool.query<ActivityLogRow>(
      `${SELECT_ACTIVITY} WHERE al.id = $1 AND al.user_id = $2`,
      [id, userId]
    );
    const row = result.rows[0];
    return row ? toActivityLog(row) : null;
  }

  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM activity_logs WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
  async listWithoutPoints(): Promise<{ activityLogId: string; userId: string }[]> {
    const result = await pool.query<{ id: string; user_id: string }>(
      `SELECT al.id, al.user_id
       FROM activity_logs al
       LEFT JOIN point_events pe ON pe.activity_log_id = al.id
       WHERE pe.activity_log_id IS NULL`
    );
    return result.rows.map((row) => ({
      activityLogId: row.id,
      userId: row.user_id,
    }));
  }

    async findForPoints(id: string): Promise<ActivityForPoints | null> {
    const result = await pool.query<ActivityForPointsRow>(
      `SELECT al.id, al.user_id, al.duration_minutes, al.distance_km,
              at.points_per_minute, at.points_per_km
       FROM activity_logs al
       JOIN activity_types at ON at.id = al.activity_type_id
       WHERE al.id = $1`,
      [id]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      durationMinutes: row.duration_minutes,
      distanceKm: row.distance_km === null ? null : Number(row.distance_km),
      pointsPerMinute: Number(row.points_per_minute),
      pointsPerKm: Number(row.points_per_km),
    };
  }

  async savePoints(
    activityLogId: string,
    userId: string,
    points: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO point_events (user_id, activity_log_id, points, reason)
       VALUES ($1, $2, $3, 'activity')
       ON CONFLICT (activity_log_id) DO NOTHING`,
      [userId, activityLogId, points]
    );
  }
}