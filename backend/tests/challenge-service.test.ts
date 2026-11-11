import { describe, expect, it } from "vitest";
import {
  NotFoundError,
  ValidationError,
} from "../src/application/activity-service.js";
import { ChallengeService } from "../src/application/challenge-service.js";
import type {
  Challenge,
  ChallengeRepository,
  ChallengeStanding,
  NewChallenge,
} from "../src/domain/challenge.js";

class FakeChallengeRepository implements ChallengeRepository {
  private readonly challenges = new Map<string, Challenge>();
  private readonly members = new Set<string>();
  private nextId = 1;

  private view(challenge: Challenge, userId: string): Challenge {
    const prefix = `${challenge.id}:`;
    const participants = [...this.members].filter((key) =>
      key.startsWith(prefix)
    ).length;
    return {
      ...challenge,
      participants,
      joined: this.members.has(`${challenge.id}:${userId}`),
    };
  }

  async create(input: NewChallenge): Promise<Challenge> {
    const challenge: Challenge = {
      id: `c${this.nextId++}`,
      name: input.name,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdBy: input.createdBy,
      participants: 0,
      joined: false,
    };
    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  async list(userId: string): Promise<Challenge[]> {
    return [...this.challenges.values()].map((c) => this.view(c, userId));
  }

  async findById(id: string, userId: string): Promise<Challenge | null> {
    const challenge = this.challenges.get(id);
    return challenge ? this.view(challenge, userId) : null;
  }

  async join(challengeId: string, userId: string): Promise<boolean> {
    const key = `${challengeId}:${userId}`;
    if (this.members.has(key)) return false;
    this.members.add(key);
    return true;
  }

  async standings(): Promise<ChallengeStanding[]> {
    return [
      { userId: "u1", username: "beto", points: 30 },
      { userId: "u2", username: "ana", points: 10 },
    ];
  }
}

const DAY = 24 * 60 * 60 * 1000;

function build() {
  return new ChallengeService(new FakeChallengeRepository());
}

describe("ChallengeService", () => {
  it("rechaza un reto cuyo fin no es posterior al inicio", async () => {
    const start = new Date(Date.now() + DAY);
    await expect(
      build().create("u1", { name: "Reto", startsAt: start, endsAt: start })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("permite unirse a un reto activo y lo marca como unido", async () => {
    const service = build();
    const challenge = await service.create("u1", {
      name: "Reto",
      startsAt: new Date(Date.now() - DAY),
      endsAt: new Date(Date.now() + DAY),
    });
    const joined = await service.join("u2", challenge.id);
    expect(joined.joined).toBe(true);
    expect(joined.participants).toBe(1);
  });

  it("no permite unirse a un reto inexistente", async () => {
    await expect(build().join("u1", "no-existe")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("no permite unirse a un reto que ya terminó", async () => {
    const service = build();
    const challenge = await service.create("u1", {
      name: "Reto viejo",
      startsAt: new Date(Date.now() - 3 * DAY),
      endsAt: new Date(Date.now() - DAY),
    });
    await expect(service.join("u2", challenge.id)).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("numera el ranking del reto desde la posición 1", async () => {
    const service = build();
    const challenge = await service.create("u1", {
      name: "Reto",
      startsAt: new Date(Date.now() - DAY),
      endsAt: new Date(Date.now() + DAY),
    });
    const entries = await service.leaderboard("u1", challenge.id);
    expect(entries.map((entry) => entry.position)).toEqual([1, 2]);
    expect(entries[0]?.username).toBe("beto");
  });
});