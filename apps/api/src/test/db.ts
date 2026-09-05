import { prisma } from "../lib/prisma.js";

/**
 * Wipes every table between tests so each test starts from a clean slate.
 * Order matters — children before parents — even though most FKs cascade,
 * because deleteMany() issues its own DELETE per table and Postgres checks
 * constraints per statement, not deferred to transaction end.
 */
export async function resetDb() {
  await prisma.$transaction([
    prisma.report.deleteMany(),
    prisma.copyEvent.deleteMany(),
    prisma.savedItem.deleteMany(),
    prisma.like.deleteMany(),
    prisma.codeTag.deleteMany(),
    prisma.promptTag.deleteMany(),
    prisma.code.deleteMany(),
    prisma.prompt.deleteMany(),
    prisma.project.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.category.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.adminLog.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
    prisma.setting.deleteMany(),
  ]);
}

export { prisma };
