import type { Challenge, ChallengeStatus } from '@/types'

const DAY_MS = 86_400_000
const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })

const statusLabels: Record<ChallengeStatus, string> = {
  active: 'En curso',
  upcoming: 'Próximo',
  finished: 'Finalizado',
}

/** Orden para listar: primero los que están en curso, luego los próximos, al final los terminados. */
export const statusOrder: Record<ChallengeStatus, number> = {
  active: 0,
  upcoming: 1,
  finished: 2,
}

export interface ChallengeSummary {
  status: ChallengeStatus
  statusLabel: string
  /** Texto corto como "Termina en 4 días". */
  hint: string
  /** Texto como "21 oct 2026 – 20 nov 2026". */
  range: string
}

export function statusOf(challenge: Challenge, now: number = Date.now()): ChallengeStatus {
  if (now < Date.parse(challenge.startsAt)) return 'upcoming'
  if (now > Date.parse(challenge.endsAt)) return 'finished'
  return 'active'
}

function formatDate(value: string): string {
  const time = Date.parse(value)
  return Number.isNaN(time) ? 'Fecha no válida' : dateFormat.format(time)
}

function daysUntil(value: string, now: number): number {
  return Math.ceil((Date.parse(value) - now) / DAY_MS)
}

function hintOf(challenge: Challenge, status: ChallengeStatus, now: number): string {
  if (status === 'active') {
    const days = daysUntil(challenge.endsAt, now)
    return days <= 1 ? 'Termina hoy' : `Termina en ${days} días`
  }
  if (status === 'upcoming') {
    const days = daysUntil(challenge.startsAt, now)
    return days <= 1 ? 'Empieza mañana' : `Empieza en ${days} días`
  }
  return 'Ya terminó'
}

export function describeChallenge(challenge: Challenge, now: number = Date.now()): ChallengeSummary {
  const status = statusOf(challenge, now)
  return {
    status,
    statusLabel: statusLabels[status],
    hint: hintOf(challenge, status, now),
    range: `${formatDate(challenge.startsAt)} – ${formatDate(challenge.endsAt)}`,
  }
}
