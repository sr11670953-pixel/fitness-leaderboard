import type { Challenge } from '@/types'

const DAY_MS = 86_400_000

// Datos de mentira: el backend todavía no tiene rutas de retos.
// Las fechas son relativas a hoy para que siempre haya retos en curso, próximos y finalizados.
export function buildMockChallenges(now: number = Date.now()): Challenge[] {
  const at = (offsetDays: number): string => new Date(now + offsetDays * DAY_MS).toISOString()

  return [
    { id: 'mock-challenge-1', name: '30 días en movimiento', startsAt: at(-10), endsAt: at(20) },
    { id: 'mock-challenge-2', name: 'Reto de los 100 km', startsAt: at(-3), endsAt: at(4) },
    { id: 'mock-challenge-3', name: 'Semana de la resistencia', startsAt: at(5), endsAt: at(12) },
    { id: 'mock-challenge-4', name: 'Octubre activo', startsAt: at(-40), endsAt: at(-12) },
  ]
}
