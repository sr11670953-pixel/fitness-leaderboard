import { mockLeaderboard } from '@/data/mockLeaderboard'
import type { ConnectionState, LeaderboardEntry, LeaderboardMessage } from '@/types'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30_000
const SIMULATOR_INTERVAL_MS = 3000

/** Algo que se puede encender y apagar: el socket real o el simulador. */
export interface LeaderboardSource {
  start(): void
  stop(): void
}

export interface SimulatorCallbacks {
  onEntries: (entries: LeaderboardEntry[]) => void
}

export interface SocketCallbacks extends SimulatorCallbacks {
  onStatus: (state: ConnectionState) => void
  /** Un intento de conexión falló o se cayó la conexión. */
  onDrop: () => void
}

function resolveSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) return explicit
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  return `${apiUrl.replace(/^http/, 'ws')}/ws/leaderboard`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEntry(value: unknown): value is LeaderboardEntry {
  return (
    isRecord(value) &&
    typeof value.position === 'number' &&
    typeof value.userId === 'string' &&
    typeof value.username === 'string' &&
    typeof value.points === 'number'
  )
}

/** Valida el texto recibido contra el contrato; si no lo cumple devuelve null. */
export function parseLeaderboardMessage(raw: string): LeaderboardMessage | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data) || data.type !== 'leaderboard' || !Array.isArray(data.entries)) {
    return null
  }
  const entries: LeaderboardEntry[] = []
  for (const item of data.entries as unknown[]) {
    if (!isEntry(item)) return null
    entries.push(item)
  }
  return { type: 'leaderboard', entries }
}

/**
 * Camino único de entrada: texto -> validación -> ranking ordenado.
 * Lo usan tanto el WebSocket real como el simulador, así el simulador prueba lo mismo que usará el servidor.
 */
export function deliverRaw(raw: string, onEntries: (entries: LeaderboardEntry[]) => void): boolean {
  const message = parseLeaderboardMessage(raw)
  if (message === null) return false
  onEntries([...message.entries].sort((a, b) => a.position - b.position))
  return true
}

/** Cliente WebSocket que se reconecta solo con espera creciente (1 s, 2 s, 4 s… hasta 30 s). */
export function createLeaderboardSocket(
  callbacks: SocketCallbacks,
  url: string = resolveSocketUrl(),
): LeaderboardSource {
  let socket: WebSocket | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0
  let stopped = true

  function scheduleReconnect(): void {
    if (stopped) return
    callbacks.onDrop()
    callbacks.onStatus('reconnecting')
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempts, RECONNECT_MAX_MS)
    attempts += 1
    timer = setTimeout(() => {
      timer = null
      connect()
    }, delay)
  }

  function connect(): void {
    if (stopped) return
    if (attempts === 0) callbacks.onStatus('connecting')

    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch {
      scheduleReconnect()
      return
    }
    socket = ws

    ws.onopen = () => {
      attempts = 0
      callbacks.onStatus('open')
    }
    ws.onmessage = (event: MessageEvent<unknown>) => {
      if (typeof event.data === 'string') deliverRaw(event.data, callbacks.onEntries)
    }
    ws.onclose = () => {
      if (socket !== ws) return
      socket = null
      scheduleReconnect()
    }
  }

  return {
    start() {
      if (!stopped) return
      stopped = false
      attempts = 0
      connect()
    },
    stop() {
      stopped = true
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      if (socket !== null) {
        socket.onopen = null
        socket.onmessage = null
        socket.onclose = null
        socket.close()
        socket = null
      }
    },
  }
}

/** Emite un ranking falso cada pocos segundos mientras el backend no tenga el WebSocket. */
export function createLeaderboardSimulator(
  callbacks: SimulatorCallbacks,
  intervalMs: number = SIMULATOR_INTERVAL_MS,
): LeaderboardSource {
  let timer: ReturnType<typeof setInterval> | null = null
  let current: LeaderboardEntry[] = []

  function emit(): void {
    const message: LeaderboardMessage = { type: 'leaderboard', entries: current }
    deliverRaw(JSON.stringify(message), callbacks.onEntries)
  }

  function tick(): void {
    const index = Math.floor(Math.random() * current.length)
    const bumped = current.map((entry, i) =>
      i === index ? { ...entry, points: entry.points + 10 + Math.floor(Math.random() * 70) } : entry,
    )
    bumped.sort((a, b) => b.points - a.points)
    current = bumped.map((entry, i) => ({ ...entry, position: i + 1 }))
    emit()
  }

  return {
    start() {
      if (timer !== null) return
      current = mockLeaderboard.map((entry) => ({ ...entry }))
      emit()
      timer = setInterval(tick, intervalMs)
    },
    stop() {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    },
  }
}
