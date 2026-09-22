import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(8).max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
});
