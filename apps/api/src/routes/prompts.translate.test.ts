import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetDb, prisma } from "../test/db.js";
import { agent, createPrompt, createUser, loginAs } from "../test/helpers.js";

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stands in for the Anthropic Messages API so no test makes a real call. */
function stubModel(body: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function modelReply(fields: { title: string; description: string; content: string }) {
  return { content: [{ type: "text", text: JSON.stringify(fields) }] };
}

describe("POST /api/prompts/:id/translate", () => {
  it("translates, then stores the result so a second request is a cache hit", async () => {
    const prompt = await createPrompt({ content: "اكتب عن {{topic}}." });
    const translated = {
      title: "Test prompt",
      description: "A prompt used in tests.",
      content: "Write about {{topic}}.",
    };
    const fetchMock = stubModel(modelReply(translated));

    const first = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "en" });
    expect(first.status).toBe(200);
    expect(first.body.content).toBe("Write about {{topic}}.");
    expect(first.body.cached).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "en" });
    expect(second.status).toBe(200);
    expect(second.body.content).toBe("Write about {{topic}}.");
    expect(second.body.cached).toBe(true);
    // The whole point of the cache: the second view costs nothing.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("serves a cached translation without calling the model at all", async () => {
    const prompt = await createPrompt();
    await prisma.promptTranslation.create({
      data: {
        promptId: prompt.id,
        language: "en",
        title: "Cached title",
        description: "Cached description",
        content: "Cached content",
      },
    });
    const fetchMock = stubModel(modelReply({ title: "x", description: "y", content: "z" }));

    const res = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "en" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Cached title");
    expect(res.body.cached).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported language", async () => {
    const prompt = await createPrompt();
    const res = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "fr" });
    expect(res.status).toBe(422);
  });

  it("does not expose another user's private prompt", async () => {
    const { user: owner } = await createUser({ role: "EDITOR" });
    const prompt = await createPrompt({ authorId: owner.id, visibility: "PRIVATE" });

    const res = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "en" });

    expect(res.status).toBe(404);
  });

  it("surfaces a clean error when the model returns something unparseable", async () => {
    const prompt = await createPrompt();
    stubModel({ content: [{ type: "text", text: "sorry, I can't do that" }] });

    const res = await agent().post(`/api/prompts/${prompt.id}/translate`).send({ language: "en" });

    expect(res.status).toBe(502);
    expect(await prisma.promptTranslation.count()).toBe(0);
  });
});

describe("PATCH /api/prompts/:id — translation cache", () => {
  it("drops cached translations when the prompt text changes", async () => {
    const { request, user } = await loginAs({ role: "EDITOR" });
    const prompt = await createPrompt({ authorId: user.id });
    await prisma.promptTranslation.create({
      data: {
        promptId: prompt.id,
        language: "en",
        title: "Old title",
        description: "Old description",
        content: "Old content",
      },
    });

    const res = await request.patch(`/api/prompts/${prompt.id}`).send({ content: "نص جديد تمامًا." });

    expect(res.status).toBe(200);
    expect(await prisma.promptTranslation.count({ where: { promptId: prompt.id } })).toBe(0);
  });

  it("keeps cached translations when only untranslated fields change", async () => {
    const { request, user } = await loginAs({ role: "EDITOR" });
    const prompt = await createPrompt({ authorId: user.id });
    await prisma.promptTranslation.create({
      data: {
        promptId: prompt.id,
        language: "en",
        title: "Still valid",
        description: "Still valid",
        content: "Still valid",
      },
    });

    const res = await request.patch(`/api/prompts/${prompt.id}`).send({ aiModel: "claude-opus-5" });

    expect(res.status).toBe(200);
    expect(await prisma.promptTranslation.count({ where: { promptId: prompt.id } })).toBe(1);
  });
});
