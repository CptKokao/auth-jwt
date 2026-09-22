import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";
import { AccessTokenPayload, verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing access token"));
  }

  const token = header.slice("Bearer ".length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired access token"));
  }
}
