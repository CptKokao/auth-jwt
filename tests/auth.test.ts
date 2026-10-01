import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { extractCookie } from "./helpers";

const email = "user@example.com";
const password = "password123";

async function signup() {
  return request(app).post("/api/auth/signup").send({ email, password });
}

describe("Auth", () => {
  it("signs up a new user and returns an access token", async () => {
    const res = await signup();
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(extractCookie(res)).toContain("refreshToken=");
  });

  it("rejects signup with an existing email", async () => {
    await signup();
    const res = await signup();
    expect(res.status).toBe(409);
  });

  it("rejects an invalid signup payload", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
  });

  it("logs in with valid credentials", async () => {
    await signup();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("rejects login with a wrong password", async () => {
    await signup();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("returns 401 on /me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user on /me with a valid token", async () => {
    const signupRes = await signup();
    const token = signupRes.body.accessToken;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it("refreshes tokens with a valid refresh cookie", async () => {
    const signupRes = await signup();
    const cookie = extractCookie(signupRes);
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("rejects refresh after logout", async () => {
    const signupRes = await signup();
    const cookie = extractCookie(signupRes);
    await request(app).post("/api/auth/logout").set("Cookie", cookie);
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});

describe("Roles", () => {
  it("returns role USER in /me after signup", async () => {
    const signupRes = await signup();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signupRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("USER");
  });

  it("returns 401 on /admin without a token", async () => {
    const res = await request(app).get("/api/auth/admin");
    expect(res.status).toBe(401);
  });

  it("returns 403 on /admin with a USER token", async () => {
    const signupRes = await signup();
    const res = await request(app)
      .get("/api/auth/admin")
      .set("Authorization", `Bearer ${signupRes.body.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("returns the user list on /admin with an ADMIN token", async () => {
    await signup();
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    const res = await request(app)
      .get("/api/auth/admin")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].role).toBe("ADMIN");
  });
});
