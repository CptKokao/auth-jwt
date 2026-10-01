import { afterAll, beforeAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma";

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "RefreshToken", "User" CASCADE',
  );
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "RefreshToken", "User" CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
