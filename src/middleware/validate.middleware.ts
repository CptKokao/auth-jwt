import { NextFunction, Request, Response } from "express";
import { ZodType, ZodError } from "zod";
import { ApiError } from "../utils/api-error";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        next(new ApiError(400, "Validation failed", details));
      } else {
        next(error);
      }
    }
  };
}
