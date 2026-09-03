import { Prisma } from "@prisma/client";

/**
 * Prisma's `include: { profile: true }` on a User relation returns every
 * scalar field of User — including passwordHash and googleId — because
 * `include` only adds relations on top of "all columns", it never narrows
 * them. Every route that surfaces an author/reporter/admin must use one of
 * these `select` fragments instead, never a bare `include`.
 */
export const publicUserSelect = {
  id: true,
  role: true,
  profile: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.UserSelect;

export const adminUserListSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
  profile: { select: { id: true, displayName: true, avatarUrl: true, bio: true } },
} satisfies Prisma.UserSelect;
