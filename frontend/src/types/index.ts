export type UserRole = 'user' | 'admin'

/**
 * Usuario de la sesión.
 * OJO: GET /auth/me solo devuelve `id` y `role`; email, username y createdAt
 * llegan únicamente en la respuesta de login/registro.
 */
export interface User {
  id: string
  role: UserRole
  email?: string
  username?: string
  createdAt?: string
}

export interface ActivityType {
  id: number
  name: string
  pointsPerMinute: number
  pointsPerKm: number
}

export interface Activity {
  id: string
  userId: string
  activityTypeId: number
  activityTypeName: string
  durationMinutes: number
  distanceKm: number | null
  performedAt: string
  createdAt: string
  points: number
}

export interface NewActivityInput {
  activityTypeId: number
  durationMinutes: number
  distanceKm: number | null
  performedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  username: string
}

export interface LoginResponse {
  user: User
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}

export interface MeResponse {
  user: User
}

export type FieldErrors = Record<string, string[]>

export interface ApiErrorBody {
  error: string
  details?: FieldErrors
}

/** Fila del ranking. Es exactamente la que llega por WebSocket (contrato del backend). */
export interface LeaderboardEntry {
  position: number
  userId: string
  username: string
  points: number
}

/** Mensaje de ws://localhost:3000/ws/leaderboard */
export interface LeaderboardMessage {
  type: 'leaderboard'
  entries: LeaderboardEntry[]
}

export type ConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting'

export interface Challenge {
  id: string
  name: string
  startsAt: string
  endsAt: string
}

export type ChallengeStatus = 'active' | 'upcoming' | 'finished'
