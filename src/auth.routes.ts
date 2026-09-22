import { Router } from "express";
import { authenticate } from "./middleware/auth.middleware";
import { loginSchema, signupSchema } from "./auth.schemas";
import * as authController from "./auth.controller";
import { validate } from "./middleware/validate.middleware";

export const appRouter = Router();

appRouter.post("/signup", validate(signupSchema), authController.signup);
appRouter.post("/login", validate(loginSchema), authController.login);
appRouter.post("/refresh", authController.refresh);
appRouter.post("/logout", authController.logout);
appRouter.get("/me", authenticate, authController.me);
