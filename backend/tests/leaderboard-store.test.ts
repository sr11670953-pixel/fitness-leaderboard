import { describe, expect, it, vi } from "vitest";
import { InMemoryLeaderboardStore } from "../src/infrastructure/leaderboard/in-memory-leaderboard-store.js";

describe("InMemoryLeaderboardStore", () => {
  it("ordena de mayor a menor puntaje", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.setScore("a", 10);
    await store.setScore("b", 30);
    await store.setScore("c", 20);
    const top = await store.top(10);
    expect(top.map((entry) => entry.userId)).toEqual(["b", "c", "a"]);
  });

  it("desempata por userId para que el orden sea estable", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.setScore("b", 50);
    await store.setScore("a", 50);
    const top = await store.top(10);
    expect(top.map((entry) => entry.userId)).toEqual(["a", "b"]);
  });

  it("incrementScore suma y setScore reemplaza", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.incrementScore("a", 10);
    await store.incrementScore("a", 5);
    expect(await store.top(1)).toEqual([{ userId: "a", points: 15 }]);
    await store.setScore("a", 3);
    expect(await store.top(1)).toEqual([{ userId: "a", points: 3 }]);
  });

  it("respeta el límite pedido", async () => {
    const store = new InMemoryLeaderboardStore();
    await store.setScore("a", 1);
    await store.setScore("b", 2);
    await store.setScore("c", 3);
    expect(await store.top(2)).toHaveLength(2);
  });

  it("avisa a los oyentes cuando cambia un puntaje", async () => {
    const store = new InMemoryLeaderboardStore();
    const listener = vi.fn();
    store.onChange(listener);
    await store.incrementScore("a", 5);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});