import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { appRouter } from "./auth.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", appRouter);

app.use(notFoundHandler);
app.use(errorHandler);
