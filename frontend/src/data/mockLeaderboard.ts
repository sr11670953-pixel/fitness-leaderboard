import type { LeaderboardEntry } from '@/types'

// Datos de mentira con la MISMA forma que enviará el backend por WebSocket.
// Cuando el servidor exista, la pantalla no cambia: solo dejan de usarse.
export const mockLeaderboard: LeaderboardEntry[] = [
  { position: 1, userId: 'mock-1', username: 'camila_run', points: 2480 },
  { position: 2, userId: 'mock-2', username: 'andres_bike', points: 2215 },
  { position: 3, userId: 'mock-3', username: 'valeria_fit', points: 1960 },
  { position: 4, userId: 'mock-4', username: 'juanpa_pesas', points: 1735 },
  { position: 5, userId: 'mock-5', username: 'sofi_nada', points: 1590 },
  { position: 6, userId: 'mock-6', username: 'mateo_trail', points: 1344 },
  { position: 7, userId: 'mock-7', username: 'luciana_walk', points: 1102 },
  { position: 8, userId: 'mock-8', username: 'dani_cross', points: 868 },
]
