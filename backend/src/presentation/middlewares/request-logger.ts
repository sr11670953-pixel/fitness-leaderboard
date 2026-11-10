import type { NextFunction, Request, Response } from "express";
import { logger } from "../../infrastructure/logger.js";
import { getCorrelationId } from "./correlation-id.js";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    logger.info("request", {
      correlationId: getCorrelationId(res),
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });
  next();
}