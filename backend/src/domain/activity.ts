export interface ActivityType {
  id: number;
  name: string;
  pointsPerMinute: number;
  pointsPerKm: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityTypeId: number;
  activityTypeName: string;
  durationMinutes: number;
  distanceKm: number | null;
  performedAt: Date;
  createdAt: Date;
  points: number;
}

export interface NewActivityLog {
  userId: string;
  activityTypeId: number;
  durationMinutes: number;
  distanceKm: number | null;
  performedAt: Date;
}

export interface ActivityForPoints {
  id: string;
  userId: string;
  durationMinutes: number;
  distanceKm: number | null;
  pointsPerMinute: number;
  pointsPerKm: number;
}

export interface ActivityRepository {
  findTypeById(id: number): Promise<ActivityType | null>;
  listTypes(): Promise<ActivityType[]>;
  create(activity: NewActivityLog): Promise<ActivityLog>;
  listByUser(userId: string): Promise<ActivityLog[]>;
  findByIdForUser(id: string, userId: string): Promise<ActivityLog | null>;
  deleteForUser(id: string, userId: string): Promise<boolean>;
  findForPoints(id: string): Promise<ActivityForPoints | null>;
  savePoints(activityLogId: string, userId: string, points: number): Promise<void>;
}