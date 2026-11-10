import type {
  Challenge,
  ChallengeRepository,
  ChallengeStanding,
  NewChallenge,
} from "../../domain/challenge.js";
import { pool } from "./pool.js";

interface ChallengeRow {
  id: string;
  name: string;
  starts_at: Date;
  ends_at: Date;
  created_by: string;
  participants: string;
  joined: boolean;
}

interface StandingRow {
  user_id: string;
  username: string;
  total: string;
}

function toChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    name: row.name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdBy: row.created_by,
    participants: Number(row.participants),
    joined: row.joined,
  };
}

const SELECT_CHALLENGE = `
  SELECT c.id, c.name, c.starts_at, c.ends_at, c.created_by,
         (SELECT COUNT(*) FROM challenge_participants cp
           WHERE cp.challenge_id = c.id) AS participants,
         EXISTS (SELECT 1 FROM challenge_participants cp
           WHERE cp.challenge_id = c.id AND cp.user_id = $1) AS joined
  FROM challenges c
`;

export class PgChallengeRepository implements ChallengeRepository {
  async create(challenge: NewChallenge): Promise<Challenge> {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO challenges (name, starts_at, ends_at, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [challenge.name, challenge.startsAt, challenge.endsAt, challenge.createdBy]
    );
    const id = inserted.rows[0]?.id;
    if (!id) throw new Error("No se pudo crear el reto");
    const created = await this.findById(id, challenge.createdBy);
    if (!created) throw new Error("No se pudo leer el reto creado");
    return created;
  }

  async list(userId: string): Promise<Challenge[]> {
    const result = await pool.query<ChallengeRow>(
      `${SELECT_CHALLENGE} ORDER BY c.starts_at DESC`,
      [userId]
    );
    return result.rows.map(toChallenge);
  }

  async findById(id: string, userId: string): Promise<Challenge | null> {
    const result = await pool.query<ChallengeRow>(
      `${SELECT_CHALLENGE} WHERE c.id = $2`,
      [userId, id]
    );
    const row = result.rows[0];
    return row ? toChallenge(row) : null;
  }

  async join(challengeId: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `INSERT INTO challenge_participants (challenge_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [challengeId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async standings(challengeId: string): Promise<ChallengeStanding[]> {
    const result = await pool.query<StandingRow>(
      `SELECT u.id AS user_id, u.username,
              COALESCE(SUM(pe.points), 0) AS total
       FROM challenge_participants cp
       JOIN challenges c ON c.id = cp.challenge_id
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN activity_logs al
         ON al.user_id = cp.user_id
        AND al.performed_at >= c.starts_at
        AND al.performed_at <= c.ends_at
       LEFT JOIN point_events pe ON pe.activity_log_id = al.id
       WHERE cp.challenge_id = $1
       GROUP BY u.id, u.username
       ORDER BY total DESC, u.username ASC`,
      [challengeId]
    );
    return result.rows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      points: Number(row.total),
    }));
  }
}