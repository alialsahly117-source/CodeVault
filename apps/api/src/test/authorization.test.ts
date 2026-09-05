import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, prisma } from "./db.js";
import { agent, createCode, createUser, loginAs } from "./helpers.js";

beforeEach(async () => {
  await resetDb();
});

describe("publishing is staff-only", () => {
  it("blocks a plain USER from creating a code", async () => {
    const { request } = await loginAs({ role: "USER" });
    const res = await request.post("/api/codes").send({
      title: "Should not be allowed",
      description: "A regular user should not be able to publish this.",
      language: "JavaScript",
      content: "1",
    });
    expect(res.status).toBe(403);
    expect(await prisma.code.count()).toBe(0);
  });

  it.each(["EDITOR", "MODERATOR", "ADMIN"] as const)("allows role %s to create a code", async (role) => {
    const { request } = await loginAs({ role });
    const res = await request.post("/api/codes").send({
      title: "Allowed for staff",
      description: "A staff member should be able to publish this.",
      language: "JavaScript",
      content: "1",
    });
    expect(res.status).toBe(201);
  });

  it("rejects an unauthenticated request entirely (401 before the role check)", async () => {
    const res = await agent().post("/api/codes").send({
      title: "No session at all",
      description: "There is no cookie on this request.",
      language: "JavaScript",
      content: "1",
    });
    expect(res.status).toBe(401);
  });
});

describe("ownership checks on update/delete", () => {
  it("blocks a different user from editing someone else's code", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id });
    const { request } = await loginAs({ role: "EDITOR" });

    const res = await request.patch(`/api/codes/${code.id}`).send({ title: "Hijacked title" });
    expect(res.status).toBe(403);
    expect((await prisma.code.findUniqueOrThrow({ where: { id: code.id } })).title).toBe(code.title);
  });

  it("lets an admin edit any code regardless of authorship", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id });
    const { request } = await loginAs({ role: "ADMIN" });

    const res = await request.patch(`/api/codes/${code.id}`).send({ title: "Admin override" });
    expect(res.status).toBe(200);
  });
});

describe("IDOR: private content must stay private", () => {
  it("hides a private code's detail page from a non-owner", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, visibility: "PRIVATE" });
    const { request } = await loginAs({ role: "USER" });

    const res = await request.get(`/api/codes/${code.id}`);
    expect(res.status).toBe(404);
  });

  it("still lets the owner view their own private code", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, visibility: "PRIVATE" });
    const request = agent();
    await request.post("/api/auth/login").send({ email: owner.email, password: owner.password });

    const res = await request.get(`/api/codes/${code.id}`);
    expect(res.status).toBe(200);
  });

  // Regression test for the vulnerability found in review: liking/saving a
  // private code used to work for anyone, and the full content then came
  // back through /users/me/saved.
  it("refuses to like a private code belonging to someone else", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, visibility: "PRIVATE" });
    const { request } = await loginAs({ role: "USER" });

    const res = await request.post(`/api/codes/${code.id}/like`);
    expect(res.status).toBe(404);
    expect(await prisma.like.count()).toBe(0);
  });

  it("refuses to save a private code, and it never appears in /users/me/saved", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, visibility: "PRIVATE" });
    const { request } = await loginAs({ role: "USER" });

    const saveRes = await request.post(`/api/codes/${code.id}/save`);
    expect(saveRes.status).toBe(404);

    const listRes = await request.get("/api/users/me/saved");
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual([]);
  });

  it("does not leak a private code's content through the copy-tracking endpoint, even anonymously", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, visibility: "PRIVATE" });

    const res = await agent().post(`/api/codes/${code.id}/copy`);
    expect(res.status).toBe(404);
    expect(await prisma.copyEvent.count()).toBe(0);
  });

  it("does not expose a private project's page to a stranger", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const project = await prisma.project.create({
      data: {
        title: "Secret project",
        slug: "secret-project-test",
        description: "Should not be visible to outsiders.",
        visibility: "PRIVATE",
        authorId: owner.user.id,
      },
    });

    const res = await agent().get(`/api/projects/${project.slug}`);
    expect(res.status).toBe(404);
  });
});

describe("admin self-action guards", () => {
  it("blocks an admin from changing their own role", async () => {
    const { request, user } = await loginAs({ role: "ADMIN" });
    const res = await request.patch(`/api/admin/users/${user.id}/role`).send({ role: "USER" });
    expect(res.status).toBe(400);
  });

  it("blocks an admin from deleting their own account", async () => {
    const { request, user } = await loginAs({ role: "ADMIN" });
    const res = await request.delete(`/api/admin/users/${user.id}`);
    expect(res.status).toBe(400);
  });

  it("blocks a moderator from banning another moderator", async () => {
    const target = await createUser({ role: "MODERATOR" });
    const { request } = await loginAs({ role: "MODERATOR" });
    const res = await request.patch(`/api/admin/users/${target.user.id}/status`).send({ status: "BANNED" });
    expect(res.status).toBe(403);
  });

  it("lets an admin ban a moderator", async () => {
    const target = await createUser({ role: "MODERATOR" });
    const { request } = await loginAs({ role: "ADMIN" });
    const res = await request.patch(`/api/admin/users/${target.user.id}/status`).send({ status: "BANNED" });
    expect(res.status).toBe(200);
  });

  it("blocks a plain USER from reaching any admin route", async () => {
    const { request } = await loginAs({ role: "USER" });
    const res = await request.get("/api/admin/users");
    expect(res.status).toBe(403);
  });
});
