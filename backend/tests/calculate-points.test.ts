import { describe, expect, it } from "vitest";
import { calculatePoints } from "../src/application/activity-service.js";

describe("calculatePoints", () => {
  it("suma minutos y kilómetros (Correr 30 min y 5 km = 55)", () => {
    expect(
      calculatePoints({ pointsPerMinute: 1, pointsPerKm: 5 }, 30, 5)
    ).toBe(55);
  });

  it("sin distancia solo cuenta los minutos", () => {
    expect(
      calculatePoints({ pointsPerMinute: 1.2, pointsPerKm: 0 }, 45, null)
    ).toBe(54);
  });

  it("calcula Ciclismo 20 min y 5 km = 26", () => {
    expect(
      calculatePoints({ pointsPerMinute: 0.8, pointsPerKm: 2 }, 20, 5)
    ).toBe(26);
  });

  it("redondea al entero más cercano", () => {
    expect(
      calculatePoints({ pointsPerMinute: 0.9, pointsPerKm: 0 }, 5, null)
    ).toBe(5);
  });
});