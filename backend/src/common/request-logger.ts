import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId?: string };

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const requestId = req.header("x-request-id") || randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const status = res.statusCode;

    const line = {
      level: "info",
      msg: "request",
      requestId,
      method,
      path,
      status,
      durationMs,
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(line));
  });

  next();
}
