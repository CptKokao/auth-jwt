import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { appRouter } from "./auth.routes";

export const app = express();
// Оно говорит Express: «доверяй заголовку X-Forwarded-For, который прокси добавляет в запрос, и бери настоящий IP клиента из него».
// TRUST_PROXY - количество хопов от прокси
app.set("trust proxy", env.TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", appRouter);

app.use(notFoundHandler);
app.use(errorHandler);
