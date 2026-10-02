import { rateLimit } from "express-rate-limit";
import { env } from "../config/env";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  skip: () => env.NODE_ENV === "test",
  message: { error: "Отправлено слишком много запросов. Попробуйте позже!" },
});
