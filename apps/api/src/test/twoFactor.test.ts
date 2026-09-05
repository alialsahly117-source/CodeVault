import { describe, it, expect, beforeEach } from "vitest";
import { generate as generateTotp } from "otplib";
import { resetDb, prisma } from "./db.js";
import { agent, loginAs, createUser } from "./helpers.js";

beforeEach(async () => {
  await resetDb();
});

/** Runs /setup then /enable, returning the confirmed secret and backup codes. */
async function enableTwoFactor(request: ReturnType<typeof agent>) {
  const setupRes = await request.post("/api/auth/2fa/setup");
  expect(setupRes.status).toBe(200);
  const { secret } = setupRes.body;

  const enableRes = await request.post("/api/auth/2fa/enable").send({
    secret,
    token: await generateTotp({ secret }),
  });
  expect(enableRes.status).toBe(200);
  return { secret, backupCodes: enableRes.body.backupCodes as string[] };
}

describe("two-factor setup and enable", () => {
  it("issues a QR code and secret that a valid code confirms", async () => {
    const { request } = await loginAs();
    const { secret, backupCodes } = await enableTwoFactor(request);
    expect(secret).toBeTruthy();
    expect(backupCodes).toHaveLength(10);

    const res = await request.get("/api/auth/me");
    expect(res.body.twoFactorEnabled).toBe(true);
  });

  it("rejects enabling with a wrong code", async () => {
    const { request } = await loginAs();
    const setupRes = await request.post("/api/auth/2fa/setup");

    const res = await request.post("/api/auth/2fa/enable").send({ secret: setupRes.body.secret, token: "000000" });
    expect(res.status).toBe(400);

    expect((await prisma.user.findMany({ where: { twoFactorEnabled: true } })).length).toBe(0);
  });

  it("refuses to set up 2FA twice on the same account", async () => {
    const { request } = await loginAs();
    await enableTwoFactor(request);

    const res = await request.post("/api/auth/2fa/setup");
    expect(res.status).toBe(400);
  });
});

describe("login with two-factor enabled", () => {
  it("pauses login after a correct password and asks for a code", async () => {
    const { email, password } = await createUser();
    const setup = agent();
    await setup.post("/api/auth/login").send({ email, password });
    const { secret } = await enableTwoFactor(setup);

    const fresh = agent();
    const res = await fresh.post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.requiresTwoFactor).toBe(true);
    expect(res.body.pendingToken).toBeTruthy();
    // No session cookie yet — the password alone must not be enough.
    expect((await fresh.get("/api/auth/me")).status).toBe(401);

    const done = await fresh.post("/api/auth/2fa/login").send({
      pendingToken: res.body.pendingToken,
      token: await generateTotp({ secret }),
    });
    expect(done.status).toBe(200);
    expect((await fresh.get("/api/auth/me")).status).toBe(200);
  });

  it("rejects a wrong code at the second step", async () => {
    const { email, password } = await createUser();
    const setup = agent();
    await setup.post("/api/auth/login").send({ email, password });
    await enableTwoFactor(setup);

    const fresh = agent();
    const login = await fresh.post("/api/auth/login").send({ email, password });

    const res = await fresh.post("/api/auth/2fa/login").send({
      pendingToken: login.body.pendingToken,
      token: "000000",
    });
    expect(res.status).toBe(401);
  });

  it("consumes a backup code exactly once", async () => {
    const { email, password } = await createUser();
    const setup = agent();
    await setup.post("/api/auth/login").send({ email, password });
    const { backupCodes } = await enableTwoFactor(setup);
    const code = backupCodes[0];

    const first = agent();
    const login1 = await first.post("/api/auth/login").send({ email, password });
    const used = await first.post("/api/auth/2fa/login").send({ pendingToken: login1.body.pendingToken, token: code });
    expect(used.status).toBe(200);

    const second = agent();
    const login2 = await second.post("/api/auth/login").send({ email, password });
    const reused = await second
      .post("/api/auth/2fa/login")
      .send({ pendingToken: login2.body.pendingToken, token: code });
    expect(reused.status).toBe(401);
  });

  it("rejects an expired or forged pending token", async () => {
    const res = await agent()
      .post("/api/auth/2fa/login")
      .send({ pendingToken: "not-a-real-token", token: "123456" });
    expect(res.status).toBe(401);
  });
});

describe("disabling two-factor", () => {
  it("requires the account password plus a valid code", async () => {
    const { email, password } = await createUser();
    const setup = agent();
    await setup.post("/api/auth/login").send({ email, password });
    const { secret } = await enableTwoFactor(setup);

    const wrongPassword = await setup
      .post("/api/auth/2fa/disable")
      .send({ password: "not-the-password", token: await generateTotp({ secret }) });
    expect(wrongPassword.status).toBe(401);

    const wrongToken = await setup.post("/api/auth/2fa/disable").send({ password, token: "000000" });
    expect(wrongToken.status).toBe(401);

    const res = await setup
      .post("/api/auth/2fa/disable")
      .send({ password, token: await generateTotp({ secret }) });
    expect(res.status).toBe(204);

    const me = await setup.get("/api/auth/me");
    expect(me.body.twoFactorEnabled).toBe(false);

    // With 2FA off, a plain login goes straight through again.
    const fresh = agent();
    const login = await fresh.post("/api/auth/login").send({ email, password });
    expect(login.body.requiresTwoFactor).toBeUndefined();
    expect(login.status).toBe(200);
  });
});
