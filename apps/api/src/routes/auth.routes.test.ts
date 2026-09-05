import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { resetDb, prisma } from "../test/db.js";
import { agent, createUser, loginAs, uniqueEmail } from "../test/helpers.js";

beforeEach(async () => {
  await resetDb();
});

describe("POST /api/auth/register", () => {
  it("creates a user and sets session cookies", async () => {
    const email = uniqueEmail();
    const res = await agent()
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-battery-staple", displayName: "New User" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe("USER");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("accessToken="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    const { email } = await createUser();
    const res = await agent()
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-battery-staple", displayName: "Dup" });
    expect(res.status).toBe(409);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ email: uniqueEmail(), password: "short", displayName: "X" });
    expect(res.status).toBe(422);
  });

  it("rejects registration while the site has registration closed", async () => {
    await prisma.setting.upsert({
      where: { id: "singleton" },
      update: { allowRegistration: false },
      create: { id: "singleton", allowRegistration: false },
    });
    const res = await agent()
      .post("/api/auth/register")
      .send({ email: uniqueEmail(), password: "correct-horse-battery-staple", displayName: "X" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the correct password", async () => {
    const { email, password } = await createUser();
    const res = await agent().post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
  });

  it("rejects the wrong password without revealing which part was wrong", async () => {
    const { email } = await createUser();
    const res = await agent().post("/api/auth/login").send({ email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error).not.toMatch(/password|email/i); // Arabic message, just sanity that it's generic
  });

  it("rejects a login for an unknown email with the same generic error as a wrong password", async () => {
    const wrongPassword = await agent()
      .post("/api/auth/login")
      .send({ email: uniqueEmail(), password: "irrelevant123" });
    const { email } = await createUser();
    const wrongEmail = await agent().post("/api/auth/login").send({ email, password: "wrong" });
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(wrongEmail.body.error);
  });

  it("blocks a banned account even with the correct password", async () => {
    const { email, password } = await createUser({ status: "BANNED" });
    const res = await agent().post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(403);
  });

  it("blocks a suspended account even with the correct password", async () => {
    const { email, password } = await createUser({ status: "SUSPENDED" });
    const res = await agent().post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a session", async () => {
    const res = await agent().get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user's own profile, never the password hash", async () => {
    const { request, user } = await loginAs();
    const res = await request.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.hasPassword).toBe(true);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session so /me becomes unauthorized again", async () => {
    const { request } = await loginAs();
    expect((await request.get("/api/auth/me")).status).toBe(200);
    const logoutRes = await request.post("/api/auth/logout");
    expect(logoutRes.status).toBe(204);
    expect((await request.get("/api/auth/me")).status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("responds the same way for a known and an unknown email (no user enumeration)", async () => {
    const { email } = await createUser();
    const known = await agent().post("/api/auth/forgot-password").send({ email });
    const unknown = await agent().post("/api/auth/forgot-password").send({ email: uniqueEmail() });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it("only creates a reset token row for an email that actually exists", async () => {
    const { user, email } = await createUser();
    await agent().post("/api/auth/forgot-password").send({ email });
    await agent().post("/api/auth/forgot-password").send({ email: uniqueEmail() });
    const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
    const allTokens = await prisma.passwordResetToken.findMany();
    expect(tokens.length).toBe(1);
    expect(allTokens.length).toBe(1); // the unknown email created nothing
  });
});

describe("POST /api/auth/reset-password", () => {
  async function createResetToken(userId: string) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    return rawToken;
  }

  it("resets the password and lets the user log in with the new one", async () => {
    const { user, email } = await createUser({ password: "old-password-123" });
    const token = await createResetToken(user.id);

    const resetRes = await agent().post("/api/auth/reset-password").send({ token, password: "brand-new-password-456" });
    expect(resetRes.status).toBe(200);

    const loginOld = await agent().post("/api/auth/login").send({ email, password: "old-password-123" });
    expect(loginOld.status).toBe(401);
    const loginNew = await agent().post("/api/auth/login").send({ email, password: "brand-new-password-456" });
    expect(loginNew.status).toBe(200);
  });

  it("rejects an unknown token", async () => {
    const res = await agent()
      .post("/api/auth/reset-password")
      .send({ token: "0".repeat(64), password: "brand-new-password-456" });
    expect(res.status).toBe(400);
  });

  it("rejects reusing an already-used token", async () => {
    const { user } = await createUser();
    const token = await createResetToken(user.id);
    const first = await agent().post("/api/auth/reset-password").send({ token, password: "first-new-password-1" });
    expect(first.status).toBe(200);
    const second = await agent().post("/api/auth/reset-password").send({ token, password: "second-new-password-2" });
    expect(second.status).toBe(400);
  });

  it("rejects an expired token", async () => {
    const { user } = await createUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await agent().post("/api/auth/reset-password").send({ token: rawToken, password: "whatever-1234" });
    expect(res.status).toBe(400);
  });

  // Regression test for a real bug found in review: two concurrent requests
  // with the same valid token could both pass the "not used yet" check
  // before either write committed, letting the token be used twice.
  it("only lets one of two concurrent requests with the same token succeed", async () => {
    const { user } = await createUser();
    const token = await createResetToken(user.id);

    const [a, b] = await Promise.all([
      agent().post("/api/auth/reset-password").send({ token, password: "password-from-request-a" }),
      agent().post("/api/auth/reset-password").send({ token, password: "password-from-request-b" }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 400]);
  });
});
