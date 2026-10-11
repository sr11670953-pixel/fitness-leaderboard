import type { LeaderboardEntry } from '@/types'

// Datos de mentira: el ranking en vivo todavía no existe en el backend.
export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'mock-1', username: 'camila_run', points: 2480, activities: 31 },
  { rank: 2, userId: 'mock-2', username: 'andres_bike', points: 2215, activities: 24 },
  { rank: 3, userId: 'mock-3', username: 'valeria_fit', points: 1960, activities: 27 },
  { rank: 4, userId: 'mock-4', username: 'juanpa_pesas', points: 1735, activities: 22 },
  { rank: 5, userId: 'mock-5', username: 'sofi_nada', points: 1590, activities: 19 },
  { rank: 6, userId: 'mock-6', username: 'mateo_trail', points: 1344, activities: 16 },
  { rank: 7, userId: 'mock-7', username: 'luciana_walk', points: 1102, activities: 21 },
  { rank: 8, userId: 'mock-8', username: 'dani_cross', points: 868, activities: 12 },
]
