import { Router } from "express";
import { authenticate, requireRole } from "./middleware/auth.middleware";
import { loginSchema, signupSchema } from "./auth.schemas";
import * as authController from "./auth.controller";
import { validate } from "./middleware/validate.middleware";
import { limiter } from "./middleware/rate-limit.middleware";

export const appRouter = Router();

appRouter.post(
  "/signup",
  limiter,
  validate(signupSchema),
  authController.signup,
);
appRouter.post("/login", limiter, validate(loginSchema), authController.login);
appRouter.post("/refresh", authController.refresh);
appRouter.post("/logout", authController.logout);
appRouter.get("/me", authenticate, authController.me);
appRouter.get(
  "/admin",
  authenticate,
  requireRole("ADMIN"),
  authController.adminUsers,
);
