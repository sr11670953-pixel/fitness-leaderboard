export type JobHandler<T> = (payload: T) => Promise<void>;

export interface JobQueue<T> {
  enqueue(payload: T): Promise<void>;
  process(handler: JobHandler<T>): void;
  stop(): Promise<void>;
}

export interface PointsJob {
  activityLogId: string;
  userId: string;
}