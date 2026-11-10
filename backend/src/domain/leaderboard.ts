export interface LeaderboardScore {
  userId: string;
  points: number;
}

export interface LeaderboardStore {
  incrementScore(userId: string, points: number): Promise<void>;
  setScore(userId: string, points: number): Promise<void>;
  top(limit: number): Promise<LeaderboardScore[]>;
}