import { NextFunction, Request, Response } from "express";
import { env } from "./config/env";
import * as authService from "./auth.service";
import { ApiError } from "./utils/api-error";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_PATH = "/api/auth";
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // синхронно с REFRESH_TOKEN_TTL=7d

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: REFRESH_TTL_MS,
  });
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.signup(req.body);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ accessToken: tokens.accessToken });
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.login(req.body);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!oldToken) {
      throw new ApiError(401, "Отсутствует refresh токен");
    }

    const tokens = await authService.refresh(oldToken);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
