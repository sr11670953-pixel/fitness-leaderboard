export interface Challenge {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
  participants: number;
  joined: boolean;
}

export interface NewChallenge {
  name: string;
  startsAt: Date;
  endsAt: Date;
  createdBy: string;
}

export interface ChallengeStanding {
  userId: string;
  username: string;
  points: number;
}

export interface ChallengeEntry extends ChallengeStanding {
  position: number;
}

export interface ChallengeRepository {
  create(challenge: NewChallenge): Promise<Challenge>;
  list(userId: string): Promise<Challenge[]>;
  findById(id: string, userId: string): Promise<Challenge | null>;
  join(challengeId: string, userId: string): Promise<boolean>;
  standings(challengeId: string): Promise<ChallengeStanding[]>;
}