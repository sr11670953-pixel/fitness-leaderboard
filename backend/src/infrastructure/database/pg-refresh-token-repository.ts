import type {
  NewRefreshToken,
  RefreshToken,
  RefreshTokenRepository,
} from "../../domain/refresh-token.js";
import { pool } from "./pool.js";

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

function toRefreshToken(row: RefreshTokenRow): RefreshToken {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    familyId: row.family_id,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export class PgRefreshTokenRepository implements RefreshTokenRepository {
  async create(token: NewRefreshToken): Promise<RefreshToken> {
    const result = await pool.query<RefreshTokenRow>(
      `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [token.userId, token.tokenHash, token.familyId, token.expiresAt]
    );
    const row = result.rows[0];
    if (!row) throw new Error("No se pudo crear el refresh token");
    return toRefreshToken(row);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const result = await pool.query<RefreshTokenRow>(
      "SELECT * FROM refresh_tokens WHERE token_hash = $1",
      [tokenHash]
    );
    const row = result.rows[0];
    return row ? toRefreshToken(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL",
      [id]
    );
  }

  async revokeFamily(familyId: string): Promise<void> {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE family_id = $1 AND revoked_at IS NULL",
      [familyId]
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId]
    );
  }
}