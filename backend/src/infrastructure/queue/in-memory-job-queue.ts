import type { JobHandler, JobQueue } from "../../domain/job-queue.js";

interface QueueItem<T> {
  payload: T;
  attempts: number;
}

export interface InMemoryQueueOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

export class InMemoryJobQueue<T> implements JobQueue<T> {
  private readonly items: QueueItem<T>[] = [];
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private handler: JobHandler<T> | null = null;
  private running = false;
  private stopped = false;
  private current: Promise<void> | null = null;

  constructor(options: InMemoryQueueOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 500;
  }

  async enqueue(payload: T): Promise<void> {
    if (this.stopped) {
      throw new Error("La cola está detenida");
    }
    this.items.push({ payload, attempts: 0 });
    this.drain();
  }

  process(handler: JobHandler<T>): void {
    this.handler = handler;
    this.drain();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    if (this.current) await this.current;
  }

  private drain(): void {
    if (this.running || !this.handler || this.stopped) return;
    this.running = true;
    this.current = this.run(this.handler);
  }

  private async run(handler: JobHandler<T>): Promise<void> {
    while (!this.stopped) {
      const item = this.items.shift();
      if (!item) break;
      try {
        await handler(item.payload);
      } catch (error) {
        this.handleFailure(item, error);
      }
    }
    this.running = false;
  }

  private handleFailure(item: QueueItem<T>, error: unknown): void {
    item.attempts += 1;

    if (item.attempts >= this.maxAttempts) {
      console.error("Trabajo descartado tras varios intentos", {
        payload: item.payload,
        error,
      });
      return;
    }

    const delay = this.baseDelayMs * 2 ** (item.attempts - 1);
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (this.stopped) return;
      this.items.push(item);
      this.drain();
    }, delay);
    this.timers.add(timer);
  }
}