import type {
  Challenge,
  ChallengeEntry,
  ChallengeRepository,
} from "../domain/challenge.js";
import { NotFoundError, ValidationError } from "./activity-service.js";

export interface CreateChallengeInput {
  name: string;
  startsAt: Date;
  endsAt: Date;
}

export class ChallengeService {
  constructor(private readonly challenges: ChallengeRepository) {}

  async create(
    userId: string,
    input: CreateChallengeInput
  ): Promise<Challenge> {
    if (input.endsAt <= input.startsAt) {
      throw new ValidationError(
        "La fecha de fin debe ser posterior a la de inicio"
      );
    }
    return this.challenges.create({ ...input, createdBy: userId });
  }

  list(userId: string): Promise<Challenge[]> {
    return this.challenges.list(userId);
  }

  async join(userId: string, challengeId: string): Promise<Challenge> {
    const challenge = await this.challenges.findById(challengeId, userId);
    if (!challenge) throw new NotFoundError("Reto no encontrado");
    if (challenge.endsAt <= new Date()) {
      throw new ValidationError("El reto ya terminó");
    }
    await this.challenges.join(challengeId, userId);
    const updated = await this.challenges.findById(challengeId, userId);
    if (!updated) throw new NotFoundError("Reto no encontrado");
    return updated;
  }

  async leaderboard(
    userId: string,
    challengeId: string
  ): Promise<ChallengeEntry[]> {
    const challenge = await this.challenges.findById(challengeId, userId);
    if (!challenge) throw new NotFoundError("Reto no encontrado");
    const standings = await this.challenges.standings(challengeId);
    return standings.map((standing, index) => ({
      position: index + 1,
      ...standing,
    }));
  }
}