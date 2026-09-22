import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ApiError } from "../utils/api-error";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
