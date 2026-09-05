import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, prisma } from "../test/db.js";
import { agent, createCode, createUser, loginAs } from "../test/helpers.js";

beforeEach(async () => {
  await resetDb();
});

describe("POST /api/codes — publishing", () => {
  it("creates a code with tags, defaulting to public/published", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "Debounce hook",
      description: "A reusable debounce hook for React inputs.",
      language: "TypeScript",
      content: "export function useDebounce() {}",
      tags: ["react", "hooks"],
    });

    expect(res.status).toBe(201);
    expect(res.body.visibility).toBe("PUBLIC");
    expect(res.body.status).toBe("PUBLISHED");
    expect(res.body.tags.map((t: { tag: { name: string } }) => t.tag.name).sort()).toEqual(["hooks", "react"]);
  });

  it("reuses an existing tag instead of creating a duplicate", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    await request.post("/api/codes").send({
      title: "First",
      description: "First code using the shared tag.",
      language: "JavaScript",
      content: "1",
      tags: ["react"],
    });
    await request.post("/api/codes").send({
      title: "Second",
      description: "Second code reusing the same tag.",
      language: "JavaScript",
      content: "2",
      tags: ["react"],
    });

    const tags = await prisma.tag.findMany({ where: { name: "react" } });
    expect(tags.length).toBe(1);
  });

  it("rejects a title shorter than 3 characters", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "ab",
      description: "A description long enough to pass validation.",
      language: "JavaScript",
      content: "1",
    });
    expect(res.status).toBe(422);
  });

  it("rejects a description shorter than 10 characters", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "Valid title",
      description: "short",
      language: "JavaScript",
      content: "1",
    });
    expect(res.status).toBe(422);
  });

  it("rejects an invalid preview image URL", async () => {
    const { request } = await loginAs({ role: "EDITOR" });
    const res = await request.post("/api/codes").send({
      title: "Valid title",
      description: "A description long enough to pass validation.",
      language: "JavaScript",
      content: "1",
      previewImageUrl: "not-a-url",
    });
    expect(res.status).toBe(422);
  });
});

describe("PATCH /api/codes/:id — updates", () => {
  it("only changes the fields sent, leaving the rest untouched", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id, title: "Original title" });
    const request = agent();
    await request.post("/api/auth/login").send({ email: owner.email, password: owner.password });

    const res = await request.patch(`/api/codes/${code.id}`).send({ description: "Updated description only." });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Original title");
    expect(res.body.description).toBe("Updated description only.");
  });

  it("replaces tags entirely when new tags are sent, not merges them", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const request = agent();
    await request.post("/api/auth/login").send({ email: owner.email, password: owner.password });
    const created = await request.post("/api/codes").send({
      title: "Tag replace test",
      description: "Starts with two tags, then gets one.",
      language: "JavaScript",
      content: "1",
      tags: ["a", "b"],
    });

    const res = await request.patch(`/api/codes/${created.body.id}`).send({ tags: ["c"] });
    expect(res.body.tags.map((t: { tag: { name: string } }) => t.tag.name)).toEqual(["c"]);
  });
});

describe("DELETE /api/codes/:id", () => {
  it("removes the code and its like/save rows", async () => {
    const owner = await createUser({ role: "EDITOR" });
    const code = await createCode({ authorId: owner.user.id });
    const liker = await createUser();
    await prisma.like.create({ data: { userId: liker.user.id, codeId: code.id, itemType: "CODE" } });

    const request = agent();
    await request.post("/api/auth/login").send({ email: owner.email, password: owner.password });
    const res = await request.delete(`/api/codes/${code.id}`);

    expect(res.status).toBe(204);
    expect(await prisma.code.findUnique({ where: { id: code.id } })).toBeNull();
    expect(await prisma.like.count()).toBe(0);
  });
});

describe("POST /api/codes/:id/like — toggle and duplicate protection", () => {
  it("toggles like on then off", async () => {
    const code = await createCode({ visibility: "PUBLIC" });
    const { request } = await loginAs({ role: "USER" });

    const on = await request.post(`/api/codes/${code.id}/like`);
    expect(on.status).toBe(200);
    expect(on.body.liked).toBe(true);

    const off = await request.post(`/api/codes/${code.id}/like`);
    expect(off.body.liked).toBe(false);

    expect((await prisma.code.findUniqueOrThrow({ where: { id: code.id } })).likeCount).toBe(0);
  });

  it("keeps likeCount correct even if two like requests race", async () => {
    const code = await createCode({ visibility: "PUBLIC" });
    const { request } = await loginAs({ role: "USER" });

    const [a, b] = await Promise.all([
      request.post(`/api/codes/${code.id}/like`),
      request.post(`/api/codes/${code.id}/like`),
    ]);

    // Exactly one of the two racing requests should have created the like —
    // the DB's unique(userId, codeId) constraint guarantees this even
    // though the route itself only does a check-then-act read first.
    const likeCount = await prisma.like.count({ where: { codeId: code.id } });
    expect(likeCount).toBe(1);
    expect([a.status, b.status].every((s) => s === 200 || s === 409)).toBe(true);
  });
});
