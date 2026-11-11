import { describe, expect, it, vi } from "vitest";
import { InMemoryJobQueue } from "../src/infrastructure/queue/in-memory-job-queue.js";

describe("InMemoryJobQueue", () => {
  it("procesa los trabajos en orden", async () => {
    const queue = new InMemoryJobQueue<number>();
    const results: number[] = [];
    queue.process(async (n) => {
      results.push(n);
    });
    await queue.enqueue(1);
    await queue.enqueue(2);
    await queue.enqueue(3);
    await vi.waitFor(() => expect(results).toEqual([1, 2, 3]));
    await queue.stop();
  });

  it("reintenta un trabajo fallido hasta que funciona", async () => {
    const queue = new InMemoryJobQueue<number>({
      maxAttempts: 5,
      baseDelayMs: 1,
    });
    let calls = 0;
    const done: number[] = [];
    queue.process(async (n) => {
      calls += 1;
      if (calls < 3) throw new Error("falla temporal");
      done.push(n);
    });
    await queue.enqueue(7);
    await vi.waitFor(() => expect(done).toEqual([7]));
    expect(calls).toBe(3);
    await queue.stop();
  });

  it("descarta el trabajo tras agotar los intentos", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const queue = new InMemoryJobQueue<number>({
      maxAttempts: 3,
      baseDelayMs: 1,
    });
    let calls = 0;
    queue.process(async () => {
      calls += 1;
      throw new Error("siempre falla");
    });
    await queue.enqueue(1);
    await vi.waitFor(() => expect(calls).toBe(3));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(calls).toBe(3);
    expect(spy).toHaveBeenCalled();
    await queue.stop();
    spy.mockRestore();
  });

  it("no acepta trabajos después de detenerse", async () => {
    const queue = new InMemoryJobQueue<number>();
    await queue.stop();
    await expect(queue.enqueue(1)).rejects.toThrow();
  });
});