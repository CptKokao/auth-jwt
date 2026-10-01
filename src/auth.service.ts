import crypto from "crypto";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { ApiError } from "./utils/api-error";
import { hashPassword, verifyPassword } from "./utils/password";
import {
  hashToken,
  Role,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./utils/jwt";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const adminEmails = new Set(
  env.ADMIN_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function getRoleForEmail(email: string): Role {
  return adminEmails.has(email.toLowerCase()) ? "ADMIN" : "USER";
}

// Выдача токена
async function issueTokens(
  userId: string,
  email: string,
  role: Role,
): Promise<AuthTokens> {
  const jwtId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jwtId });

  // Декодирует только что подписанный JWT и возвращает payload, из которого берётся стандартное поле exp — время истечения токена в секундах Unix. Его умножают на 1000 и кладут в expiresAt строки БД.
  const decoded = verifyRefreshToken(refreshToken);

  await prisma.refreshToken.create({
    data: {
      tokenRefreshHash: hashToken(refreshToken),
      userId,
      expiresAt: new Date((decoded.exp ?? 0) * 1000),
    },
  });

  const accessToken = signAccessToken({ sub: userId, email, role });
  return { accessToken, refreshToken };
}

export async function signup(input: { email: string; password: string }) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ApiError(409, "Email уже существует");
  }

  const passwordHash = await hashPassword(input.password);
  const role = getRoleForEmail(input.email);

  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, role },
  });

  // refreshToken уходит в заголовке set-cookie
  return issueTokens(user.id, user.email, user.role);
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new ApiError(401, "Неверные учетные данные");
  }

  const isVerify = await verifyPassword(input.password, user.passwordHash);

  if (!isVerify) {
    throw new ApiError(401, "Неверные учетные данные");
  }

  // refreshToken уходит в заголовке set-cookie
  return issueTokens(user.id, user.email, user.role);
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload; // { sub, jwtId, exp }.
  // декодирования токена для проверки подпись и срок действия
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenRefreshHash: tokenHash },
  });

  if (!stored) {
    throw new ApiError(401, "Refresh token отозван или не найден");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new ApiError(401, "Пользователь не найден");
  }

  // Ротация: отзываем старый, выдаём новый
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(user.id, user.email, user.role);
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;

  await prisma.refreshToken.deleteMany({
    where: { tokenRefreshHash: hashToken(refreshToken) },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new ApiError(404, "Пользователь не найден");
  }

  return user;
}

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
