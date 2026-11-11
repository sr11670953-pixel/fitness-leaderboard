import { describe, expect, it } from "vitest";
import { LeaderboardService } from "../src/application/leaderboard-service.js";
import type { User, UserRepository } from "../src/domain/user.js";
import { InMemoryLeaderboardStore } from "../src/infrastructure/leaderboard/in-memory-leaderboard-store.js";

class FakeUserRepository implements UserRepository {
  constructor(private readonly names: Map<string, string>) {}

  async findById(): Promise<User | null> {
    return null;
  }
  async findByEmail(): Promise<User | null> {
    return null;
  }
  async findByUsername(): Promise<User | null> {
    return null;
  }
  async create(): Promise<User> {
    throw new Error("no se usa en estas pruebas");
  }
  async findUsernamesByIds(ids: string[]): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    for (const id of ids) {
      const name = this.names.get(id);
      if (name) found.set(id, name);
    }
    return found;
  }
}

describe("LeaderboardService", () => {
  it("devuelve posiciones desde 1 con nombre de usuario y puntos", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.setScore("u1", 30);
    await store.setScore("u2", 80);
    const names = new Map([
      ["u1", "ana"],
      ["u2", "beto"],
    ]);
    const service = new LeaderboardService(store, new FakeUserRepository(names));

    expect(await service.getEntries()).toEqual([
      { position: 1, userId: "u2", username: "beto", points: 80 },
      { position: 2, userId: "u1", username: "ana", points: 30 },
    ]);
  });

  it("usa un nombre genérico si el usuario no existe", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.setScore("fantasma", 10);
    const service = new LeaderboardService(
      store,
      new FakeUserRepository(new Map())
    );
    const [entry] = await service.getEntries();
    expect(entry?.username).toBe("Usuario");
  });
});