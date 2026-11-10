import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const CORRELATION_HEADER = "x-correlation-id";

export function correlationId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const incoming = req.headers[CORRELATION_HEADER];
  const id =
    typeof incoming === "string" && incoming.length > 0 && incoming.length <= 100
      ? incoming
      : randomUUID();
  res.locals.correlationId = id;
  res.setHeader(CORRELATION_HEADER, id);
  next();
}

export function getCorrelationId(res: Response): string | undefined {
  const value: unknown = res.locals.correlationId;
  return typeof value === "string" ? value : undefined;
}