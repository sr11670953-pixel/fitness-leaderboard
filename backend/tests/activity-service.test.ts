import { describe, expect, it, vi } from "vitest";
import {
  ActivityService,
  NotFoundError,
  ValidationError,
} from "../src/application/activity-service.js";
import { CORRER, FakeActivityRepository, FakeQueue } from "./helpers/fakes.js";

function build() {
  const repo = new FakeActivityRepository();
  const queue = new FakeQueue();
  const service = new ActivityService(repo, queue);
  return { repo, queue, service };
}

const baseInput = {
  activityTypeId: CORRER.id,
  durationMinutes: 30,
  distanceKm: 5,
  performedAt: new Date(),
};

describe("ActivityService", () => {
  it("rechaza un tipo de actividad inexistente", async () => {
    const { service } = build();
    await expect(
      service.create("u1", { ...baseInput, activityTypeId: 999 })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rechaza fechas en el futuro", async () => {
    const { service } = build();
    const future = new Date(Date.now() + 60 * 60 * 1000);
    await expect(
      service.create("u1", { ...baseInput, performedAt: future })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("guarda la actividad con 0 puntos y encola el cálculo", async () => {
    const { queue, service } = build();
    const activity = await service.create("u1", baseInput);
    expect(activity.points).toBe(0);
    expect(queue.jobs).toEqual([{ activityLogId: activity.id, userId: "u1" }]);
  });

  it("no falla si la cola no está disponible", async () => {
    const { repo, queue, service } = build();
    queue.failOnEnqueue = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const activity = await service.create("u1", baseInput);
    expect(activity.id).toBeDefined();
    expect(repo.logs.size).toBe(1);
    spy.mockRestore();
  });

  it("solo entrega una actividad a su dueño", async () => {
    const { service } = build();
    const activity = await service.create("u1", baseInput);
    await expect(service.getById("u2", activity.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(service.getById("u1", activity.id)).resolves.toMatchObject({
      id: activity.id,
    });
  });

  it("no permite borrar la actividad de otro usuario", async () => {
    const { repo, service } = build();
    const activity = await service.create("u1", baseInput);
    await expect(service.remove("u2", activity.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(repo.logs.size).toBe(1);
    await service.remove("u1", activity.id);
    expect(repo.logs.size).toBe(0);
  });

  it("lista solo las actividades del usuario", async () => {
    const { service } = build();
    await service.create("u1", baseInput);
    await service.create("u2", baseInput);
    expect(await service.list("u1")).toHaveLength(1);
  });
});