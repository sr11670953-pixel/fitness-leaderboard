import type {
  LeaderboardEntry,
  LeaderboardStore,
} from "../domain/leaderboard.js";
import type { UserRepository } from "../domain/user.js";

const DEFAULT_LIMIT = 20;

export class LeaderboardService {
  constructor(
    private readonly store: LeaderboardStore,
    private readonly users: UserRepository
  ) {}

  async getEntries(limit: number = DEFAULT_LIMIT): Promise<LeaderboardEntry[]> {
    const top = await this.store.top(limit);
    const names = await this.users.findUsernamesByIds(
      top.map((score) => score.userId)
    );
    return top.map((score, index) => ({
      position: index + 1,
      userId: score.userId,
      username: names.get(score.userId) ?? "Usuario",
      points: score.points,
    }));
  }
}