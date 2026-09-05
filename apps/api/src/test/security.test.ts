import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { resetDb, prisma } from "./db.js";
import { agent, createUser, loginAs, uniqueEmail } from "./helpers.js";
import { validateEnv } from "../config/env.js";
import { checkPassword } from "../lib/passwordPolicy.js";

beforeEach(async () => {
  await resetDb();
});

describe("password policy", () => {
  it("rejects the most common passwords at registration", async () => {
    for (const password of ["password", "12345678", "qwertyui", "letmein1"]) {
      const res = await agent()
        .post("/api/auth/register")
        .send({ email: uniqueEmail(), password, displayName: "Tester" });
      expect(res.status, `expected "${password}" to be rejected`).toBe(422);
    }
  });

  it("rejects a password made of one or two repeated characters", () => {
    expect(checkPassword("aaaaaaaa")).not.toBeNull();
    expect(checkPassword("abababab")).not.toBeNull();
  });

  it("rejects a password containing the account's own email name", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ email: "ahmedhassan@test.local", password: "ahmedhassan99", displayName: "Ahmed" });
    expect(res.status).toBe(422);
  });

  it("accepts a reasonable password", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ email: uniqueEmail(), password: "brisk-lantern-97-cedar", displayName: "Tester" });
    expect(res.status).toBe(201);
  });

  it("rejects a password longer than bcrypt's 72-byte limit rather than silently truncating it", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ email: uniqueEmail(), password: "x9".repeat(60), displayName: "Tester" });
    expect(res.status).toBe(422);
  });

  it("applies the same rules when resetting a password, not just registering", async () => {
    const { user } = await createUser();
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });

    const res = await agent().post("/api/auth/reset-password").send({ token: rawToken, password: "password123" });
    expect(res.status).toBe(422);
  });
});

describe("user-supplied URLs are restricted to https", () => {
  it.each([
    "javascript:alert(document.cookie)",
    "data:text/html,<script>alert(1)</script>",
    "http://insecure.example.com/a.png",
    "not-a-url-at-all",
  ])("rejects %s as a preview image", async (previewImageUrl) => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "URL validation test",
      description: "Checking that unsafe URL schemes are refused.",
      language: "JavaScript",
      content: "1",
      previewImageUrl,
    });
    expect(res.status).toBe(422);
  });

  it("accepts an https image URL", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "URL validation test",
      description: "Checking that a normal https URL is accepted.",
      language: "JavaScript",
      content: "1",
      previewImageUrl: "https://example.com/preview.png",
    });
    expect(res.status).toBe(201);
  });

  it("rejects a javascript: avatar URL on the profile endpoint too", async () => {
    const { request } = await loginAs();
    const res = await request.patch("/api/auth/me").send({ avatarUrl: "javascript:alert(1)" });
    expect(res.status).toBe(422);
  });

  it("still allows clearing an image by sending an empty string", async () => {
    const { request } = await loginAs();
    await request.patch("/api/auth/me").send({ avatarUrl: "https://example.com/a.png" });
    const res = await request.patch("/api/auth/me").send({ avatarUrl: "" });
    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBeNull();
  });
});

describe("refresh token rotation", () => {
  /** Reads a cookie value straight off a response's Set-Cookie headers. */
  function cookieFrom(res: { headers: Record<string, unknown> }, name: string) {
    const raw = (res.headers["set-cookie"] as string[] | undefined) ?? [];
    const match = raw.find((c) => c.startsWith(`${name}=`));
    return match?.split(";")[0]?.slice(name.length + 1);
  }

  /** Logs a fresh user in and hands back their current refresh token. */
  async function loginAndGetToken() {
    const { email, password, user } = await createUser();
    const request = agent();
    const res = await request.post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    return { request, user, token: cookieFrom(res, "refreshToken")! };
  }

  it("issues a different refresh token on every refresh", async () => {
    const { request, token } = await loginAndGetToken();

    const res = await request.post("/api/auth/refresh");
    expect(res.status).toBe(200);

    const rotated = cookieFrom(res, "refreshToken");
    expect(rotated).toBeDefined();
    expect(rotated).not.toBe(token);
  });

  it("stores one row per issued token and marks the spent one as used", async () => {
    const { request, user } = await loginAs();
    await request.post("/api/auth/refresh");

    const rows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(rows.length).toBe(2);
    expect(rows.filter((r) => r.usedAt !== null).length).toBe(1);
    // Both belong to the same login, so they share a family.
    expect(new Set(rows.map((r) => r.familyId)).size).toBe(1);
  });

  it("kills the whole session family when an already-spent token is replayed later", async () => {
    const { request, user, token: stolen } = await loginAndGetToken();

    // Legitimate rotation happens.
    await request.post("/api/auth/refresh");

    // Backdate the spent token past the tab-race grace window so the replay
    // below is unambiguous theft rather than two tabs refreshing at once.
    const spentHash = crypto.createHash("sha256").update(stolen).digest("hex");
    await prisma.refreshToken.update({
      where: { tokenHash: spentHash },
      data: { usedAt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    const attacker = agent();
    const replay = await attacker.post("/api/auth/refresh").set("Cookie", `refreshToken=${stolen}`);
    expect(replay.status).toBe(401);

    // And the legitimate user's remaining tokens are gone too — that's the
    // point of family revocation: the theft invalidates the whole line.
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0);
    expect((await request.post("/api/auth/refresh")).status).toBe(401);
  });

  it("tolerates two tabs refreshing at the same moment", async () => {
    const { token } = await loginAndGetToken();

    const [a, b] = await Promise.all([
      agent().post("/api/auth/refresh").set("Cookie", `refreshToken=${token}`),
      agent().post("/api/auth/refresh").set("Cookie", `refreshToken=${token}`),
    ]);

    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it("refuses a refresh token that has no stored row (forged or already revoked)", async () => {
    const { token } = await loginAndGetToken();
    await prisma.refreshToken.deleteMany({});

    const res = await agent().post("/api/auth/refresh").set("Cookie", `refreshToken=${token}`);
    expect(res.status).toBe(401);
  });

  it("ends the session server-side on logout, so the old token can't be reused", async () => {
    const { request, token } = await loginAndGetToken();

    await request.post("/api/auth/logout");
    expect(await prisma.refreshToken.count()).toBe(0);

    const res = await agent().post("/api/auth/refresh").set("Cookie", `refreshToken=${token}`);
    expect(res.status).toBe(401);
  });

  it("revokes every session when the password is reset", async () => {
    const { user } = await createUser();
    const loggedIn = agent();
    await loggedIn.post("/api/auth/login").send({ email: user.email, password: "correct-horse-battery-staple" });
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1);

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    await agent().post("/api/auth/reset-password").send({ token: rawToken, password: "fresh-anchor-42-willow" });

    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0);
    expect((await loggedIn.post("/api/auth/refresh")).status).toBe(401);
  });

  it("revokes the sessions of a user an admin bans", async () => {
    const target = await createUser();
    const victim = agent();
    await victim.post("/api/auth/login").send({ email: target.email, password: target.password });
    expect(await prisma.refreshToken.count({ where: { userId: target.user.id } })).toBe(1);

    const { request: admin } = await loginAs({ role: "ADMIN" });
    await admin.patch(`/api/admin/users/${target.user.id}/status`).send({ status: "BANNED" });

    expect(await prisma.refreshToken.count({ where: { userId: target.user.id } })).toBe(0);
    expect((await victim.get("/api/auth/me")).status).toBe(401);
  });
});

describe("startup configuration guard", () => {
  const snapshot = { ...process.env };
  const restore = () => {
    process.env = { ...snapshot };
  };

  it("accepts the current test configuration", () => {
    expect(() => validateEnv()).not.toThrow();
    restore();
  });

  it("refuses to start without a JWT secret", () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => validateEnv()).toThrow(/JWT_ACCESS_SECRET/);
    restore();
  });

  it("refuses to start with a short JWT secret", () => {
    process.env.JWT_ACCESS_SECRET = "tooshort";
    expect(() => validateEnv()).toThrow(/JWT_ACCESS_SECRET/);
    restore();
  });

  it("refuses to start when both JWT secrets are the same value", () => {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_ACCESS_SECRET;
    expect(() => validateEnv()).toThrow(/متطابقان/);
    restore();
  });

  it("requires secure cookies in production", () => {
    process.env.NODE_ENV = "production";
    process.env.COOKIE_SECURE = "false";
    expect(() => validateEnv()).toThrow(/COOKIE_SECURE/);
    restore();
  });

  it("refuses to start without a two-factor encryption key", () => {
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    expect(() => validateEnv()).toThrow(/TWO_FACTOR_ENCRYPTION_KEY/);
    restore();
  });
});
