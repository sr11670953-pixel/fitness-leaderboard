import argon2 from "argon2";
import type { User, UserRepository } from "../domain/user.js";

export class ConflictError extends Error {}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new ConflictError("El email ya está registrado");
    }
    if (await this.users.findByUsername(input.username)) {
      throw new ConflictError("El nombre de usuario ya está en uso");
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    const { passwordHash: _omit, ...publicUser } = await this.users.create({
      email,
      username: input.username,
      passwordHash,
    });
    return publicUser;
  }
}