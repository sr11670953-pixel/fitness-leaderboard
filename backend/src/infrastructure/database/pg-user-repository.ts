import type { NewUser, User, UserRepository, UserRole } from "../../domain/user.js";
import { pool } from "./pool.js";

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

export class PgUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query<UserRow>(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const row = result.rows[0];
    return row ? toUser(row) : null;
  }

  async create(user: NewUser): Promise<User> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.email, user.username, user.passwordHash]
    );
    const row = result.rows[0];
    if (!row) throw new Error("No se pudo crear el usuario");
    return toUser(row);
  }
    async findUsernamesByIds(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const result = await pool.query<{ id: string; username: string }>(
      "SELECT id, username FROM users WHERE id::text = ANY($1::text[])",
      [ids]
    );
    return new Map(result.rows.map((row) => [row.id, row.username]));
  }
}