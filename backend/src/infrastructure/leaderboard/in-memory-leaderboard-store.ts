import type {
  LeaderboardScore,
  LeaderboardStore,
} from "../../domain/leaderboard.js";

export class InMemoryLeaderboardStore implements LeaderboardStore {
  private readonly scores = new Map<string, number>();
  private readonly listeners: Array<() => void> = [];

  async incrementScore(userId: string, points: number): Promise<void> {
    this.scores.set(userId, (this.scores.get(userId) ?? 0) + points);
    this.notify();
  }

  async setScore(userId: string, points: number): Promise<void> {
    this.scores.set(userId, points);
    this.notify();
  }

  async top(limit: number): Promise<LeaderboardScore[]> {
    return [...this.scores.entries()]
      .map(([userId, points]) => ({ userId, points }))
      .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId))
      .slice(0, limit);
  }

  onChange(listener: () => void): void {
    this.listeners.push(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}