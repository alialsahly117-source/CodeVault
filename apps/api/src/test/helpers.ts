import bcrypt from "bcryptjs";
import supertest from "supertest";
import app from "../app.js";
import { prisma } from "./db.js";
import type { Role, UserStatus } from "@prisma/client";

export const agent = () => supertest.agent(app);

let counter = 0;
export function uniqueEmail(prefix = "user") {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.local`;
}

/** Creates a user directly via Prisma (bypasses the API) with a known password. */
export async function createUser(opts: {
  email?: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  displayName?: string;
} = {}) {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? "correct-horse-battery-staple";
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: opts.role ?? "USER",
      status: opts.status ?? "ACTIVE",
      profile: { create: { displayName: opts.displayName ?? email.split("@")[0] } },
    },
  });
  return { user, email, password };
}

/** Creates a user and returns a supertest agent already logged in as them. */
export async function loginAs(opts: Parameters<typeof createUser>[0] = {}) {
  const { user, email, password } = await createUser(opts);
  const request = agent();
  const res = await request.post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs setup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { request, user };
}

export async function createCode(overrides: Partial<{
  authorId: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: "PUBLISHED" | "HIDDEN" | "PENDING";
}> = {}) {
  const author = overrides.authorId ? null : await createUser({ role: "ADMIN" });
  return prisma.code.create({
    data: {
      title: overrides.title ?? "Test code",
      description: "A code snippet used in a test.",
      content: "console.log('hi');",
      language: "JavaScript",
      visibility: overrides.visibility ?? "PUBLIC",
      status: overrides.status ?? "PUBLISHED",
      authorId: overrides.authorId ?? author!.user.id,
    },
  });
}
